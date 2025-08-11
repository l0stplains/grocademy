import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class PagesController {
  @Get()
  @Render('index')
  home() {
    return { title: 'Hello World' };
  }
}
