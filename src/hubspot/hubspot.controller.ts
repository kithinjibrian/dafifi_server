import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Redirect } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { CreateHubspotDto } from './dto/create-hubspot.dto';
import { UpdateHubspotDto } from './dto/update-hubspot.dto';

@Controller('hubspot')
export class HubspotController {
    constructor(private readonly hubspotService: HubspotService) { }

    @Post()
    create(@Body() createHubspotDto: CreateHubspotDto) {
        return this.hubspotService.create(createHubspotDto);
    }

    @Get()
    @Redirect('https://chat.dafifi.net', 302)
    async code(@Query() query: Record<string, any>) {
        const code = query.code;
        const state = query.state;

        if (code && state) {
            try {
                return await this.hubspotService.code({
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
        return this.hubspotService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateHubspotDto: UpdateHubspotDto) {
        return this.hubspotService.update(+id, updateHubspotDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.hubspotService.remove(+id);
    }
}
