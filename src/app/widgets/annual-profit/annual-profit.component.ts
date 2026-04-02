import { Component } from '@angular/core';
import { AnnualProfitService } from './annual-profit.service';

@Component({
    selector: 'app-annual-profit:not(1)',
    imports: [],
    templateUrl: './annual-profit.component.html',
    styleUrl: './annual-profit.component.scss'
})
export class AnnualProfitComponent {

    constructor(
        private annualProfitService: AnnualProfitService
    ) {}

    ngOnInit(): void {
        this.annualProfitService.loadChart();
    }

}