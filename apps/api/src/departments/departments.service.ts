import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsRepository } from './departments.repository';

@Injectable()
export class DepartmentsService {
  constructor(private readonly repository: DepartmentsRepository) {}

  list(churchId: string) {
    return this.repository.list(churchId);
  }

  create(input: {
    churchId: string;
    actorUserId: string;
    name: string;
    description?: string;
  }) {
    return this.repository.create(input);
  }

  update(input: {
    departmentId: string;
    churchId: string;
    actorUserId: string;
    updates: UpdateDepartmentDto;
  }) {
    if (Object.values(input.updates).every((value) => value === undefined)) {
      throw new BadRequestException('Provide at least one department field.');
    }
    return this.repository.update(input);
  }

  deactivate(input: {
    departmentId: string;
    churchId: string;
    actorUserId: string;
  }) {
    return this.repository.deactivate(input);
  }

  addMember(input: {
    departmentId: string;
    churchId: string;
    actorUserId: string;
    memberId: string;
    makePrimary: boolean;
    joinedAt?: string;
  }) {
    return this.repository.addMember(input);
  }
}
