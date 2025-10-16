import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private _routes: string[] = [];

  getHello(): string {
    return 'Hello World!';
  }

  // Store discovered routes (simple in-memory store)
  setRoutes(routes: string[]) {
    this._routes = routes ?? [];
  }

  getRoutes(): string[] {
    return this._routes;
  }
}
