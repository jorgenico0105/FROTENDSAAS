import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-cut-value',
    imports: [NgClass, FormsModule],
    templateUrl: './cut-value.component.html',
    styleUrl: './cut-value.component.scss'
})
export class CutValueComponent {

    copyText: string = '#annual90conference2025'; // This is the value you want to bind to the input field
    copied: boolean = false; // Tracks if the text is cut
    buttonText: string = 'Cut'; // Button text

    // This function cuts (copies and clears) the input field value
    cutToClipboard(input: HTMLInputElement): void {
        if (!input) return;
        // Select the input field value
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
        // Write the input value to the clipboard
        navigator.clipboard
        .writeText(input.value)
        .then(() => {
            // Clear the input value after cutting
            input.value = ''; // Clear the text from the input field
            this.copyText = ''; // Update the model
            this.copied = true; // Change icon to success
            this.buttonText = ''; // Remove text temporarily
            // Reset the button and icon after 2 seconds
            setTimeout(() => {
                this.copied = false; // Revert icon
                this.buttonText = 'Cut'; // Restore text
            }, 2000);
        })
        .catch((err) => {
            console.error('Error cutting text: ', err);
        });
    }

}