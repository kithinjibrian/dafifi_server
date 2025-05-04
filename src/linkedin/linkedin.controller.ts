import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Redirect } from '@nestjs/common';
import { LinkedinService } from './linkedin.service';
import { CreateLinkedinDto } from './dto/create-linkedin.dto';
import { UpdateLinkedinDto } from './dto/update-linkedin.dto';

@Controller('linkedin')
export class LinkedinController {
    constructor(private readonly linkedinService: LinkedinService) { }

    @Post()
    create(@Body() createLinkedinDto: CreateLinkedinDto) {
        return this.linkedinService.create(createLinkedinDto);
    }

    @Get()
    @Redirect('https://chat.dafifi.net', 302)
    async code(@Query() query: Record<string, any>) {
        const code = query.code;
        const state = query.state;
        if (code && state) {
            try {
                return await this.linkedinService.code({
                    code,
                    state
                });
            } catch (e) {
                return { url: 'https://chat.dafifi.net' }
            }
        }

        return { url: 'https://chat.dafifi.net/' }
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.linkedinService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateLinkedinDto: UpdateLinkedinDto) {
        return this.linkedinService.update(+id, updateLinkedinDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.linkedinService.remove(+id);
    }
}
