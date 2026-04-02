import { Component } from '@angular/core';
import { LeadConversionService } from './lead-conversion.service';

@Component({
    selector: 'app-lead-conversion:not(1)',
    imports: [],
    templateUrl: './lead-conversion.component.html',
    styleUrl: './lead-conversion.component.scss'
})
export class LeadConversionComponent {

    constructor(
        private leadConversionService: LeadConversionService
    ) {}

    ngOnInit(): void {
        this.leadConversionService.loadChart();
    }

}