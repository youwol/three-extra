import { CanvasTexture, Sprite, SpriteMaterial, Vector3 } from "three"

export function createTextSprite(
    {text, position, rect=true, rectColor='#fffd82', fontColor='#000', fontSize=22}:
    {text: string, position: Vector3, rect?: boolean, rectColor?: string, fontColor?: string, fontSize?: number})
{

    const canvas = document.createElement('canvas')
    let ctx = canvas.getContext('2d')
    // const fontsize = 22

    ctx.font = 'bolder ' + fontSize + 'px "Open Sans", Arial'

    let size = ctx.measureText(text)
    // console.log(size)

    let paddingLeft = 5
    let paddingTop = 5
    let margin = 10

    canvas.width  = (size.width + paddingLeft*2 + margin*2)
    canvas.height = (fontSize + paddingTop*2 + margin*2)

    if (rect) {
        ctx.shadowBlur = 10
        ctx.shadowColor = '#fff'
        ctx.fillStyle = rectColor
        createRect(ctx, margin, margin, canvas.width - margin*2, canvas.height - margin*2, 10)
    }

    ctx.shadowBlur = 0
    ctx.fillStyle = fontColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.font = 'bolder ' + fontSize + 'px "Open Sans", Arial'
    ctx.fillText(text, paddingLeft + margin, paddingTop + margin)

    let texture = new CanvasTexture(canvas)
    let sprite = new Sprite(new SpriteMaterial({
        map: texture,
        sizeAttenuation: false
    }))

    let h = 0.3
    sprite.scale.set(0.002 * canvas.width, 0.0025 * canvas.height, 1).multiplyScalar(h)
    sprite.position.copy(position)
    // sprite.position.setX(sprite.position.x + canvas.width)

    return sprite
}

function createRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { 
    ctx.beginPath(); 
    ctx.moveTo(x + r, y); 
    ctx.lineTo(x + w - r, y); 
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); 
    ctx.lineTo(x + w, y + h - r); 
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); 
    ctx.lineTo(x + r, y + h); 
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); 
    ctx.lineTo(x, y + r); 
    ctx.quadraticCurveTo(x, y, x + r, y); 
    ctx.closePath(); 
    ctx.fill();
} 