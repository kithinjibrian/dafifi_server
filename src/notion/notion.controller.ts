import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Redirect } from '@nestjs/common';
import { NotionService } from './notion.service';
import { CreateNotionDto } from './dto/create-notion.dto';
import { UpdateNotionDto } from './dto/update-notion.dto';

@Controller('notion')
export class NotionController {
    constructor(private readonly notionService: NotionService) { }

    @Post()
    create(@Body() createNotionDto: CreateNotionDto) {
        return this.notionService.create(createNotionDto);
    }

    @Get()
    @Redirect('https://chat.dafifi.net', 302)
    async code(@Query() query: Record<string, any>) {
        const code = query.code;
        const state = query.state;
        if (code && state) {
            try {
                return await this.notionService.code({
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
        return this.notionService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateNotionDto: UpdateNotionDto) {
        return this.notionService.update(+id, updateNotionDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.notionService.remove(+id);
    }
}
