import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('action')
export class ActionController {
    constructor(private readonly actionService: ActionService) { }

    //@UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createActionDto: CreateActionDto) {
        return this.actionService.create(createActionDto, "req.user.username");
    }

    @Get()
    findAll() {
        return this.actionService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.actionService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateActionDto: UpdateActionDto) {
        return this.actionService.update(+id, updateActionDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.actionService.remove(+id);
    }
}
