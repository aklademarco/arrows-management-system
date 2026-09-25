import {
  FiCheckCircle,
  FiClock,
  FiMessageCircle,
  FiSmartphone,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";

import { getPastorResource } from "../pastor-api";
import { PastorMessageForm } from "./message-form";

type MessageContext = {
  canMessageChurch: boolean;
  smsAvailable: boolean;
  departments: {
    id: string;
    name: string;
  }[];
};

type SentMessage = {
  id: string;
  audience: string;
  title: string;
  body: string;
  sentAt: string;
  recipientCount: number;
  smsRequested: boolean;
  smsQueuedCount: number;
  smsSentCount: number;
  smsDeliveredCount: number;
  smsFailedCount: number;
};

const formatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

export default async function PastorMessagesPage() {
  const [context, sent] = await Promise.all([
    getPastorResource<MessageContext>("/leadership-messages/compose-context"),
    getPastorResource<SentMessage[]>("/leadership-messages/sent"),
  ]);

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-600">
            Church communication
          </p>

          <h1 className="mt-2 text-3xl font-black">Messages</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Send church-wide announcements and review previously sent messages.
          </p>
        </header>

        <section className="mt-7">
          <PastorMessageForm smsAvailable={context.smsAvailable} />
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600">
                Delivery history
              </p>

              <h2 className="mt-1 text-2xl font-black">Sent Messages</h2>
            </div>

            <span className="text-sm font-bold text-slate-400">
              {sent.length}
            </span>
          </div>

          {sent.length === 0 ? (
            <div className="mt-5 grid min-h-64 place-items-center rounded-3xl border border-dashed border-purple-200 bg-white p-6 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-purple-50 text-3xl text-purple-600">
                  <FiMessageCircle />
                </span>

                <h3 className="mt-4 text-lg font-black">
                  No messages sent yet
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Church announcements you send will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {sent.map((message) => (
                <article
                  className="rounded-3xl border border-purple-100 bg-white p-5 sm:p-6"
                  key={message.id}
                >
                  <div className="flex gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-purple-100 text-xl text-purple-700">
                      <FiMessageCircle />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-purple-600">
                            Church Broadcast
                          </p>

                          <h3 className="mt-1 text-lg font-black text-slate-950">
                            {message.title}
                          </h3>
                        </div>

                        <time
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-400"
                          dateTime={message.sentAt}
                        >
                          <FiClock />
                          {formatter.format(new Date(message.sentAt))}
                        </time>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {message.body}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-purple-50 pt-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                          <FiUsers />
                          {message.recipientCount} recipient
                          {message.recipientCount === 1 ? "" : "s"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                          Whole Church
                        </span>
                      </div>

                      {message.smsRequested && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-4">
                          <DeliveryMetric
                            icon={<FiClock />}
                            label="Queued"
                            value={message.smsQueuedCount}
                          />

                          <DeliveryMetric
                            icon={<FiSmartphone />}
                            label="Sent"
                            value={message.smsSentCount}
                          />

                          <DeliveryMetric
                            icon={<FiCheckCircle />}
                            label="Delivered"
                            value={message.smsDeliveredCount}
                          />

                          <DeliveryMetric
                            icon={<FiXCircle />}
                            label="Failed"
                            value={message.smsFailedCount}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DeliveryMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
      <span className="text-purple-600">{icon}</span>

      <div>
        <p className="text-sm font-black text-slate-900">{value}</p>

        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}
