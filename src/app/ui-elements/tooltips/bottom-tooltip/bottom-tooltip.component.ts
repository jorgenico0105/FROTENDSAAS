import { Component } from '@angular/core';

@Component({
    selector: 'app-bottom-tooltip',
    imports: [],
    templateUrl: './bottom-tooltip.component.html',
    styleUrl: './bottom-tooltip.component.scss'
})
export class BottomTooltipComponent {

    tooltipVisible = false;  // Controls visibility of the tooltip
    tooltipText: string = ''; // Text content for the tooltip

    // Show tooltip when mouse enters the button
    showTooltip(): void {
        this.tooltipText = 'Hey, Hello World!';  // Set the tooltip text
        this.tooltipVisible = true;  // Set tooltip visibility to true
    }

    // Hide tooltip when mouse leaves the button
    hideTooltip(): void {
        this.tooltipVisible = false;  // Set tooltip visibility to false
    }

}