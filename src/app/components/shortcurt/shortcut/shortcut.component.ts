import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject, distinctUntilChanged, filter, fromEvent, map, merge, Subject, Subscription, tap } from 'rxjs';

@Component({
    selector: 'app-shortcut',
    templateUrl: './shortcut.component.html',
    styleUrl: './shortcut.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: ShortcutComponent,
        },
    ],
})
export class ShortcutComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input({ required: true }) modifiers!: string[];

    @ViewChild('shortcutInput', { static: true }) private shortcutInput!: ElementRef;

    // if the shortcut matches to the system ones (for example, Alt + Tab),
    // clear the state when switching the window
    @HostListener('window:blur') onWindowBlur() {
        if (
            this.countOfModifiersPressedKeys === 0 &&
            this.countOfNotModifiersPressedKeys === 0
        ) {
            return;
        }

        this.clearState();
    }

    private subscription = new Subscription();

    protected currentPressedKeys: string[] = [];
    private countOfModifiersPressedKeys = 0;
    private countOfNotModifiersPressedKeys = 0;

    protected clearKeydownDistinctUntilChanged$ = new Subject<void>();

    protected inProgress = false;
    protected isValid = false;
    protected currentValidStateExist = false;
    protected showedKeys$ = new BehaviorSubject<string[]>([]);
    private set showedValue (newKeysArray: string[]) {
        this.showedKeys$.next(newKeysArray);

        if (this.isValid) {
            const newValueString = newKeysArray.join('+');
            this.onChange(newValueString);
        }
    }

    constructor (
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        const keydown$ = fromEvent<KeyboardEvent>(this.shortcutInput.nativeElement, 'keydown');
        const keyup$ = fromEvent<KeyboardEvent>(this.shortcutInput.nativeElement, 'keyup');

        this.subscription.add(merge(
            keydown$.pipe(
                tap((event) => event.preventDefault()),
                map((event) => event.key),
            ),
            // to reset the distinctUntilChanged state
            this.clearKeydownDistinctUntilChanged$.pipe(
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
                this.changeDetectorRef.markForCheck();
            })
        )

        this.subscription.add(keyup$
            .pipe(
                map((event) => event.key),
                tap(() => this.clearKeydownDistinctUntilChanged$.next()),
                tap((key) => {
                    const keyIndex = this.currentPressedKeys.findIndex((pressedKey) => pressedKey === key);
                    if (keyIndex < 0) {
                        return;
                    }

                    this.updateCurrentKeysCountsKeyup(key);
                    this.currentPressedKeys.splice(keyIndex, 1);

                    if (this.currentPressedKeys.length === 0) {
                        this.inProgress = false;
                    }
                })
            )
            .subscribe((key: string) => {
                this.onKeyUpHandler(key);
                this.changeDetectorRef.markForCheck();
            })
        )
    }

    // ControlValueAccessor
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    writeValue(newShortcut: string) {
        if (!newShortcut) {
            return;
        }

        console.log('writeValue', newShortcut);
        const newKeysArray = newShortcut.split('+');
        this.currentValidStateExist = true;
        this.showedValue = newKeysArray;
        this.changeDetectorRef.markForCheck();
    }

    onChange: (newShortcut: string) => void = () => {
        console.error('ShortcutComponent not connected');
    }

    registerOnChange(fn: (newShortcut: string) => void) {
        this.onChange = fn;
    }

    onTouched: () => void = () => {
        console.error('ShortcutComponent not connected');
    }

    registerOnTouched(fn: () => void) {
        this.onTouched = fn;
    }

    private clearState() {
        this.countOfModifiersPressedKeys = 0;
        this.countOfNotModifiersPressedKeys = 0;
        this.currentPressedKeys = [];
        this.inProgress = false;
        this.clearKeydownDistinctUntilChanged$.next();

        if (!this.currentValidStateExist) {
            this.showedValue = [];
        }
    }

    private onKeyDownHandler(key: string) {
        // if the component has a valid state before
        if (this.currentValidStateExist) {
            // render the old valid state until we get a new valid state
            if (this.inputValidity) {
                this.isValid = true;

                this.showedValue = [...this.currentPressedKeys];
            } else {
                this.isValid = false;
            }

            return;
        }

        // If the component doesn't have a valid state before,
        // render the pressed key inside the shortcut-input
        this.showedValue = [...this.currentPressedKeys];

        // update currentValidState if valid
        if (this.inputValidity) {
            this.currentValidStateExist = true;
            this.isValid = true;

            this.showedValue = [...this.currentPressedKeys];
        } else {
            this.isValid = false;
        }
    }

    private onKeyUpHandler(key: string) {
        // if the component doesn't have a valid state before and the current value is invalid
        if (!this.currentValidStateExist && !this.inputValidity) {
            // remove it from the render
            this.showedValue = [];
            return;
        }
    }

    private updateCurrentKeysCountsKeydown(key: string) {
        if (this.modifiers.includes(key)) {
            this.countOfModifiersPressedKeys++;
        } else {
            this.countOfNotModifiersPressedKeys++;
        }
    }

    private updateCurrentKeysCountsKeyup(key: string) {
        if (this.modifiers.includes(key)) {
            this.countOfModifiersPressedKeys--;
        } else {
            this.countOfNotModifiersPressedKeys--;
        }
    }

    private get inputValidity(): boolean {
        return this.countOfModifiersPressedKeys > 0 &&
            this.countOfNotModifiersPressedKeys === 1;
    }
}
