import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { distinctUntilChanged, filter, fromEvent, map, merge, share, Subject, tap } from 'rxjs';

@Component({
  selector: 'app-shortcut',
  templateUrl: './shortcut.component.html',
  styleUrl: './shortcut.component.scss'
})
export class ShortcutComponent implements OnInit {
    @Input() modifiers: string[] = ['Control', 'Alt', 'Shift', 'CapsLock', 'Meta'];

    @ViewChild('shortcutInput', { static: true }) private shortcutInput!: ElementRef;

    protected currentPressedKeys: string[] = [];

    ngOnInit(): void {
        const keydown$ = fromEvent<KeyboardEvent>(this.shortcutInput.nativeElement, 'keydown');
        const keyup$ = (fromEvent<KeyboardEvent>(this.shortcutInput.nativeElement, 'keyup')).pipe(share());

        merge(
            keydown$.pipe(
                tap((event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }),
                map((event) => {
                    return event.key;
                }),
            ),
            keyup$.pipe(
                map(() => '')
            ),
        )
            .pipe(
                distinctUntilChanged(),
                filter((key) => !!key),
                tap((key) => {
                    this.currentPressedKeys.push(key)
                })
            )
            .subscribe(() => {
                console.log(this.currentPressedKeys);
            })

        keyup$.subscribe((event: KeyboardEvent) => {
            console.log(event);
            this.currentPressedKeys = this.currentPressedKeys.filter((key) => key !== event.key);
            console.log(this.currentPressedKeys);
        })
    }
}
