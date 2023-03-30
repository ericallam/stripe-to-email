import { Trigger, webhookEvent } from "@trigger.dev/sdk";
import Stripe from "stripe";
import * as resend from "@trigger.dev/resend";
import WelcomeEmail from "./emails/WelcomeEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

const FROM_EMAIL =
  process.env.FROM_EMAIL ?? "Trigger.dev <hello@email.trigger.dev>";
const REPLY_TO_EMAIL =
  process.env.REPLY_TO_EMAIL ?? "Trigger.dev <hello@trigger.dev>";

new Trigger({
  // Give your Trigger a stable ID
  id: "stripe-to-email",
  name: "Stripe to Email",
  on: webhookEvent({
    service: "stripe.com",
    eventName: "customer.subscription.created",
  }),
  async run(event, ctx) {
    // Somehow get the customer email address from stripe
    const customer = await stripe.customers.retrieve(
      event.data.object.customer
    );

    if (!customer.deleted && customer.email) {
      await resend.sendEmail("📧 welcome", {
        from: FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL,
        to: customer.email,
        subject: "Welcome to BerriAI!",
        react: <WelcomeEmail name={event.name} />,
      });
    } else {
      await ctx.logger.warn("Customer is deleted or has no email", {
        customer,
      });
    }
  },
}).listen();
