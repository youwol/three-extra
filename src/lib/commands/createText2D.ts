import { DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from "three";


// From http://bl.ocks.org/phil-pedruco/9852362
//
/**
 * @example
 * ```ts
 * const title = createText2D('X')
 * title.position.x = xScale(vpts.xMax) + 12
 * title.position.y = 5
 * object3d.add(title)
 * ```
 */
export function createText2D(text: string, color = '#000000', font='Arial', size=16, segW=1, segH=1) {
    const canvas = createTextCanvas(text, color, font, size)
    const plane = new PlaneGeometry(canvas.width, canvas.height, segW, segH)
    const tex = new Texture(canvas)
    tex.needsUpdate = true
    var planeMat = new MeshBasicMaterial({
        map: tex,
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        side: DoubleSide
    })
    const mesh = new Mesh(plane, planeMat)
    mesh.scale.set(0.5, 0.5, 0.5)
    return mesh
}

function createTextCanvas(text: string, color: string = '#000000', font: string = 'Arial', size: number = 16) {
    var canvas = document.createElement('canvas')
    var ctx = canvas.getContext('2d')
    var fontStr = (size + 'px ') + font
    ctx.font = fontStr
    var w = ctx.measureText(text).width
    var h = Math.ceil(size)
    canvas.width = w
    canvas.height = h
    ctx.font = fontStr
    ctx.fillStyle = color
    ctx.fillText(text, 0, Math.ceil(size * 0.8))
    return canvas
}

// ----------------------------------------------------
