import { Injectable } from '@nestjs/common';
import { CreateErrorDto } from './dto/create-error.dto';
import { UpdateErrorDto } from './dto/update-error.dto';
import * as fs from 'fs';

@Injectable()
export class ErrorService {
    create(createErrorDto: CreateErrorDto) {
        const errorMessage = JSON.stringify(createErrorDto, null, 4);

        fs.appendFile('error.log', `${new Date().toISOString()} - ${errorMessage}\n`, (err) => {
            if (err) {
                console.error('Error writing to file', err);
            } else {
                console.log('Error logged to file');
            }
        });

        return {
            message: 'Error logged successfully',
        };
    }

    findAll() {
        return `This action returns all error`;
    }

    findOne(id: number) {
        return `This action returns a #${id} error`;
    }

    update(id: number, updateErrorDto: UpdateErrorDto) {
        return `This action updates a #${id} error`;
    }

    remove(id: number) {
        return `This action removes a #${id} error`;
    }
}
