import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { DATABASE } from '../database/database.module';
import { PushDispatchService } from './push-dispatch.service';
import { EventRemindersService } from './event-reminders.service';
import { NotificationPublisher } from './notification-publisher.service';

it('resolves notification publishers and workers in the application module', async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DATABASE)
    .useValue({})
    .compile();
  // Compile without init: no scheduled workers, network requests or real DB access.
  expect(module.get(NotificationPublisher)).toBeInstanceOf(
    NotificationPublisher,
  );
  expect(module.get(PushDispatchService)).toBeInstanceOf(PushDispatchService);
  expect(module.get(EventRemindersService)).toBeInstanceOf(
    EventRemindersService,
  );
  await module.close();
});
