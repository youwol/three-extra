export type KeyCallback = (event: KeyboardEvent) => void

export enum KeyModifier {
    ALT = 0x1,
    SHIFT = 0x2,
    CTRL = 0x4,
    META = 0x8,
}

/**
 * Install a keyboard to grab key down events. By default, the keyboard is installed
 * using the `document` if the `dom` is not provided
 * @example
 * ```ts
 * const keyboard = new threeExtra.Keyboard()
 * keyboard.addKey('u', e => threeExtra.changeView('up', controls) )
 * keyboard.addKey({key:'a', cb: e => console.log('Key a was pressed') })
 * keyboard.setUpEvent(e => console.log('Key released'))
 * ```
 *
 * Example of event type:
 * <ul>
 * <li> When the key is first pressed, the keydown event is sent.
 * <li> If the key is not a modifier key, the keypress event is sent.
 * <li> When the user releases the key, the keyup event is sent.
 * </ul>
 *
 * @category Utils
 */
export class Keyboard {
    constructor(
        private readonly dom: any,
        private readonly type: string = 'keydown',
    ) {
        if (dom === undefined) this.dom = document
        this.dom.addEventListener(type, this.proceed)
    }

    setUpEvent(cb: KeyCallback) {
        this.upCB = cb
        this.dom.addEventListener('keyup', this.upCB)
    }

    /**
     * Add a new key-binding
     * @param key The key
     * @param cb The corresponding callback to call when the key is pressed
     * @param modifier The key modifier(s)
     * @example
     * ```ts
     * const keyboard = new extra.Keyboard(document, 'keydown')
     * keyboard.addKey({key:'a', cb: e => console.log('Key a was pressed') })
     * keyboard.addKey({key:'b', cb: e => console.log('Key b was pressed') })
     * keyboard.setUpEvent(e => console.log('Key released'))
     * ```
     */
    addKey({
        key,
        cb,
        modifiers = 0,
    }: {
        key: string
        cb: KeyCallback
        modifiers?: KeyModifier
    }) {
        this.map.push({ key, cb, modifiers })
    }

    /**
     * Remove the underlaying listener from the dom
     */
    destroy() {
        this.dom.removeEventListener(this.type, this.proceed)
        if (this.upCB) this.dom.removeEventListener('keyup', this.upCB)
    }

    private proceed = (event: KeyboardEvent) => {
        if (event.defaultPrevented) {
            return // Do nothing if the event was already processed
        }

        const modifiers =
            ((event.altKey as unknown as number) * KeyModifier.ALT) |
            ((event.shiftKey as unknown as number) * KeyModifier.SHIFT) |
            ((event.ctrlKey as unknown as number) * KeyModifier.CTRL) |
            ((event.metaKey as unknown as number) * KeyModifier.META)

        this.map.forEach((b) => {
            if (b.key === event.key && modifiers === b.modifiers) {
                b.cb(event)
            }
        })
    }

    private map: Array<Binding> = []
    private upCB: KeyCallback = undefined
}

type Binding = {
    key: string
    modifiers: number
    cb: KeyCallback
}
