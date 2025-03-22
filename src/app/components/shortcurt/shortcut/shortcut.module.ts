import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShortcutComponent } from './shortcut.component';



@NgModule({
    declarations: [
        ShortcutComponent
    ],
    imports: [
        CommonModule
    ],
    exports: [
        ShortcutComponent
    ]
})
export class ShortcutModule { }
