import { Controller, Get } from '@nestjs/common';

@Controller('home')
export class HomeController {
  constructor() {}

  @Get()
  async homeController() {
    return 'Welcome to t-shirt store';
  }
}
