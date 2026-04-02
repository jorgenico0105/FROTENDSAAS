import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-icon-tabs',
    imports: [NgClass],
    templateUrl: './icon-tabs.component.html',
    styleUrl: './icon-tabs.component.scss'
})
export class IconTabsComponent {

    // Tabs
    currentTab = 'tab1';
    switchTab(event: MouseEvent, tab: string) {
        event.preventDefault();
        this.currentTab = tab;
    }

}