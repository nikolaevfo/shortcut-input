import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, fromEvent, map, merge, share, Subject, tap } from 'rxjs';

@Component({
  selector: 'app-shortcut',
  templateUrl: './shortcut.component.html',
  styleUrl: './shortcut.component.scss'
})
export class ShortcutComponent implements OnInit {
    @Input({ required: true }) modifiers!: string[];

    @ViewChild('shortcutInput', { static: true }) private shortcutInput!: ElementRef;

    protected currentPressedKeys: string[] = [];
    private countOfModifiersPressedKeys = 0;
    private countOfNotModifiersPressedKeys = 0;

    protected showedKeys$ = new BehaviorSubject<string[]>([]);
    protected inProgress = false;
    protected isValid = false;
    protected currentValidStateExist = false;

    ngOnInit (): void {
        const keydown$ = fromEvent<KeyboardEvent>(this.shortcutInput.nativeElement, 'keydown');
        const keyup$ = fromEvent<KeyboardEvent>(this.shortcutInput.nativeElement, 'keyup');

        merge(
            keydown$.pipe(
                tap((event) => event.preventDefault()),
                map((event) => event.key),
            ),
            // to reset the distinctUntilChanged state
            keyup$.pipe(
                map(() => ''),
            ),
        )
            .pipe(
                distinctUntilChanged(),
                filter((key) => !!key),
                tap((key) => {
                    this.updateCurrentKeysCountsKeydown(key);
                    this.currentPressedKeys.push(key);
                    this.inProgress = true;
                }),
            )
            .subscribe((key) => {
                this.onKeyDownHandler(key);
            })

        keyup$
            .pipe(
                map((event) => event.key),
                tap((key) => {
                    const keyIndex = this.currentPressedKeys.findIndex((pressedKey) => pressedKey === key);
                    if (keyIndex < 0) {
                        return;
                    }

                    this.updateCurrentKeysCountsKeyup(key);
                    this.currentPressedKeys.splice(keyIndex, 1);

                    if(this.currentPressedKeys.length === 0) {
                        this.inProgress = false;
                    }
                })
            )
            .subscribe((key: string) => {
                this.onKeyUpHandler(key);
            })
    }

    private onKeyDownHandler (key: string) {
        // if the component has a valid state before
        if (this.currentValidStateExist) {
            // render the old valid state until we get a new valid state
            if (this.inputValidity) {
                this.isValid = true;

                this.showedKeys$.next([...this.currentPressedKeys]);
            } else {
                this.isValid = false;
            }

            return;
        }

        // If the component doesn't have a valid state before,
        // render the pressed key inside the shortcut-input
        this.showedKeys$.next([...this.currentPressedKeys]);

        // update currentValidState if valid
        if (this.inputValidity) {
            this.currentValidStateExist = true;
            this.isValid = true;

            this.showedKeys$.next([...this.currentPressedKeys]);
        } else {
            this.isValid = false;
        }
    }

    private onKeyUpHandler (key: string) {
        // if the component doesn't have a valid state before and the current value is invalid
        if (!this.currentValidStateExist && !this.inputValidity) {
            // remove it from the render
            this.showedKeys$.next([]);
            return;
        }
    }

    private updateCurrentKeysCountsKeydown (key: string) {
        if (this.modifiers.includes(key)) {
            this.countOfModifiersPressedKeys++;
        } else {
            this.countOfNotModifiersPressedKeys++;
        }
    }

    private updateCurrentKeysCountsKeyup (key: string) {
        if (this.modifiers.includes(key)) {
            this.countOfModifiersPressedKeys--;
        } else {
            this.countOfNotModifiersPressedKeys--;
        }
    }

    private get inputValidity (): boolean {
        return this.countOfModifiersPressedKeys > 0 &&
            this.countOfNotModifiersPressedKeys === 1;
    }
}
