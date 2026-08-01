import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { createOrderSchema } from "../schemas/order";


function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}


export async function publicOrderRoutes(app: FastifyInstance) {

  app.post(
    "/public/orders",
    async (request, reply) => {

      const data = createOrderSchema.parse(request.body);


      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: {
            in: data.items.map(
              (item) => item.menuItemId
            ),
          },
          isAvailable: true,
        },
      });


      if (menuItems.length !== data.items.length) {
        return reply.status(400).send({
          message: "Invalid or unavailable menu item",
        });
      }


      const restaurantId = menuItems[0].restaurantId;


      let totalAmount = 0;


      for (const item of data.items) {

        const menuItem = menuItems.find(
          (m) => m.id === item.menuItemId
        );

        if (!menuItem) continue;


        totalAmount +=
          Number(menuItem.price) *
          item.quantity;
      }



      const order = await prisma.$transaction(
        async (tx) => {

          const createdOrder =
            await tx.order.create({
              data: {
                orderNumber:
                  generateOrderNumber(),

                customerName:
                  data.customerName,

                customerPhone:
                  data.customerPhone,

                totalAmount,

                restaurantId,
              },
            });



          await tx.orderItem.createMany({
            data: data.items.map((item)=>{

              const menuItem =
                menuItems.find(
                  (m)=>
                  m.id === item.menuItemId
                )!;


              return {
                orderId:
                  createdOrder.id,

                menuItemId:
                  menuItem.id,

                quantity:
                  item.quantity,

                price:
                  menuItem.price,
              };

            }),
          });


          return createdOrder;

        }
      );


      return reply.status(201).send(order);

    }
  );

}
