import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { distinctUntilChanged, filter, fromEvent, map, merge, share, Subject, tap } from 'rxjs';

@Component({
  selector: 'app-shortcut',
  templateUrl: './shortcut.component.html',
  styleUrl: './shortcut.component.scss'
})
export class ShortcutComponent implements OnInit {
    @Input({ required: true }) modifiers!: string[];

    @ViewChild('shortcutInput', { static: true }) private shortcutInput!: ElementRef;

    protected currentPressedKeys: string[] = [];
    private countOfModifiers = 0;
    private countOfNotModifiers = 0;
    protected resultKeys$ = new Subject<string[]>();

    ngOnInit(): void {
        const keydown$ = fromEvent<KeyboardEvent>(this.shortcutInput.nativeElement, 'keydown');
        const keyup$ = fromEvent<KeyboardEvent>(this.shortcutInput.nativeElement, 'keyup');

        merge(
            keydown$.pipe(
                tap((event) => {
                    event.preventDefault();
                }),
                map((event) => {
                    return event.key;
                }),
            ),
            // to reset the distinctUntilChanged state
            keyup$.pipe(
                map(() => '')
            ),
        )
            .pipe(
                distinctUntilChanged(),
                filter((key) => !!key),
                tap((key) => {
                    this.updateCurrentKeysCountsKeydown(key);
                    this.currentPressedKeys.push(key);
                }),
            )
            .subscribe(() => {
                this.updateResultKeysValue();
            })

        keyup$.subscribe((event: KeyboardEvent) => {
            const keyIndex = this.currentPressedKeys.findIndex((key) => key === event.key);
            if (keyIndex < 0) {
                return;
            }

            this.updateCurrentKeysCountsKeyup(event.key);
            this.currentPressedKeys.splice(keyIndex, 1)
            this.updateResultKeysValue();
        })
    }

    private updateCurrentKeysCountsKeydown(key: string) {
        if(this.modifiers.includes(key)) {
            this.countOfModifiers++;
        } else {
            this.countOfNotModifiers++;
        }
    }

    private updateCurrentKeysCountsKeyup(key: string) {
        if(this.modifiers.includes(key)) {
            this.countOfModifiers--;
        } else {
            this.countOfNotModifiers--;
        }
    }

    private updateResultKeysValue() {
        console.log(this.countOfModifiers, this.countOfNotModifiers);
        if(
            this.countOfModifiers > 0 &&
            this.countOfNotModifiers === 1
        ) {
            this.resultKeys$.next(this.currentPressedKeys)
        } else {
            this.resultKeys$.next([])
        }
    }
}
