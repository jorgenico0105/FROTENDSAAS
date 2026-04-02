import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BottomTooltipComponent } from './bottom-tooltip/bottom-tooltip.component';

@Component({
    selector: 'app-tooltips',
    imports: [RouterLink, BottomTooltipComponent],
    templateUrl: './tooltips.component.html',
    styleUrl: './tooltips.component.scss'
})
export class TooltipsComponent {

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