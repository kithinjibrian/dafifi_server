import { Controller, Redirect, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GoogleService } from './google.service';
import { CreateGoogleDto } from './dto/create-google.dto';
import { UpdateGoogleDto } from './dto/update-google.dto';


@Controller('google')
export class GoogleController {
    constructor(private readonly googleService: GoogleService) { }

    @Post()
    create(@Body() CreateGoogleDto: CreateGoogleDto) {
        return this.googleService.create(CreateGoogleDto);
    }

    @Get()
    @Redirect('https://chat.dafifi.net', 302)
    async code(@Query() query: Record<string, any>) {
        const code = query.code;
        const state = query.state;
        if (code && state) {
            return await this.googleService.code({
                code,
                state
            });
        }

        return { url: 'https://chat.dafifi.net/' }
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.googleService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() UpdateGoogleDto: UpdateGoogleDto) {
        return this.googleService.update(+id, UpdateGoogleDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.googleService.remove(+id);
    }
}
