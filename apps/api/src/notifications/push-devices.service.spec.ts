import { validate } from 'class-validator';
import { PushDeviceDto } from './dto/push-device.dto';
import { PushDevicesService } from './push-devices.service';
import { PushDevicesRepository } from './push-devices.repository';

const user = {
  id: 'user',
  churchId: 'church',
  email: 'member@example.com',
  roles: ['MEMBER'],
};
it.each([true, false])(
  'scopes device changes to the authenticated principal (%s)',
  async (enabled) => {
    const update = jest.fn().mockResolvedValue(undefined);
    const service = new PushDevicesService({
      update,
    } as unknown as PushDevicesRepository);
    await expect(
      service.update('device:token', enabled, user),
    ).resolves.toEqual({ enabled });
    expect(update).toHaveBeenCalledWith('device:token', enabled, user);
  },
);
it.each(['', 'bad token', 'x'.repeat(4097)])(
  'rejects invalid device tokens',
  async (token) => {
    expect(
      (await validate(Object.assign(new PushDeviceDto(), { token }))).length,
    ).toBeGreaterThan(0);
  },
);
it('accepts FCM token characters', async () => {
  expect(
    await validate(
      Object.assign(new PushDeviceDto(), { token: 'device:ABC_def-123' }),
    ),
  ).toEqual([]);
});
