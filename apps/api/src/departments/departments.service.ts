import { Injectable } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';

@Injectable()
export class DepartmentsService {
  constructor(private readonly repository: DepartmentsRepository) {}

  list(churchId: string) {
    return this.repository.list(churchId);
  }
}
