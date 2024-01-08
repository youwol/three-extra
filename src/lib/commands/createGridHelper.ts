import {
    Box3,
    Box3Helper,
    BufferGeometry,
    Camera,
    Color,
    DoubleSide,
    Euler,
    Float32BufferAttribute,
    Group,
    LineBasicMaterial,
    LineSegments,
    Material,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PlaneGeometry,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three'
import { createTextSprite } from './createTextSprite'
import { animate } from '../animationLoop'
import { RenderFunctions } from '../renderFunctions'

export class GridTextParameters {
    rect: boolean
    rectColor: string
    fontColor: string
    fontSize: number

    constructor({
        rect = true,
        rectColor = '#fffd82',
        fontColor = '#000',
        fontSize = 22,
    }: {
        rect?: boolean
        rectColor?: string
        fontColor?: string
        fontSize?: number
    } = {}) {
        this.rect = rect
        this.rectColor = rectColor
        this.fontColor = fontColor
        this.fontSize = fontSize
    }
}

export class GridHeplerParameters {
    renderFunctions: RenderFunctions
    scene: Scene
    camera: Camera
    renderer: WebGLRenderer
    extendCoef: number
    fading: boolean
    fadingTime: number
    showPlanes: boolean
    opacity: number
    color: string
    showBBox: boolean
    divisions: number

    constructor({
        scene,
        camera,
        renderer,
        renderFunctions,
        extendCoef,
        fading,
        fadingTime,
        showPlanes,
        color,
        showBBox,
        divisions,
    }: {
        scene: Scene
        camera: Camera
        renderer: WebGLRenderer
        renderFunctions: RenderFunctions
        extendCoef?: number
        fading?: boolean
        fadingTime?: number
        showPlanes?: boolean
        color?: string
        showBBox?: boolean
        divisions?: number
    }) {
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.renderFunctions = renderFunctions
        this.extendCoef = extendCoef !== undefined ? extendCoef : 1
        this.fading = fading !== undefined ? fading : true
        this.fadingTime = fadingTime !== undefined ? fadingTime : 300
        this.showPlanes = showPlanes !== undefined ? showPlanes : true
        this.color = color !== undefined ? color : '#aaaaaa'
        this.showBBox = showBBox !== undefined ? showBBox : false
        this.divisions = divisions !== undefined ? divisions : 10
    }
}

export function createGridHelper(
    object: Object3D,
    params: GridHeplerParameters,
    text = new GridTextParameters(),
) {
    return new GridsHelper(object, params, text)
}

/*
TODO:
    - separate the size for each axis
    - axis size should be greater than 30% of the max axis size
*/

// class Obj {
//     grid  : GridHelper
//     plane : Mesh
//     group : Group
// }

class GridsHelper {
    private uuidFct: string
    private gridNorth: GridHelper
    private gridSouth: GridHelper
    private gridWest: GridHelper
    private gridEast: GridHelper
    private gridTop: GridHelper
    private gridBottom: GridHelper
    private planeNorth: Mesh
    private planeSouth: Mesh
    private planeWest: Mesh
    private planeEast: Mesh
    private planeTop: Mesh
    private planeBottom: Mesh
    private groupEast: Group
    private groupWest: Group
    private groupNorth: Group
    private groupSouth: Group
    private groupTop: Group
    private groupBottom: Group

    private renderFunctions: RenderFunctions = undefined
    private renderer: WebGLRenderer = undefined
    private scene: Scene = undefined
    private camera: Camera = undefined
    private group: Group
    private params: GridHeplerParameters = undefined

    constructor(
        object: Object3D,
        params: GridHeplerParameters,
        private textParams: GridTextParameters,
    ) {
        this.renderFunctions = params.renderFunctions
        this.renderer = params.renderer
        this.camera = params.camera
        this.scene = params.scene
        this.params = params

        this.generateGrid(object)

        this.uuidFct = this.renderFunctions.add(() => {
            this.update()
            this.renderer.render(this.scene, this.camera)
        })

        this.update()
    }

    dispose() {
        this.renderFunctions.remove(this.uuidFct)
        this.scene.remove(this.group)
    }

    update() {
        if (this.params.fading === false) {
            this.groupEast.visible = this.canSee(this.camera, Direction.XPLUS)
            this.groupWest.visible = this.canSee(this.camera, Direction.XMINUS)
            this.gridSouth.visible = this.canSee(this.camera, Direction.YMINUS)
            this.groupNorth.visible = this.canSee(this.camera, Direction.YPLUS)
            this.groupTop.visible = this.canSee(this.camera, Direction.ZPLUS)
            this.groupBottom.visible = this.canSee(
                this.camera,
                Direction.ZMINUS,
            )
            return
        }

        const fade = (name: string, dir: Direction) => {
            const view = this.canSee(this.camera, dir)

            if (
                !this['updating' + name] &&
                this['grid' + name].visible !== view
            ) {
                const mat1 = this['plane' + name].material as Material
                const mat2 = this['grid' + name].material as Material
                this['updating' + name] = true

                if (this['plane' + name].visible === false) {
                    mat1.opacity = 0
                    mat2.opacity = 0
                } else {
                    this['grid' + name].visible = false
                }

                animate({
                    cb: (t: number) => {
                        mat1.opacity = view ? t : 1 - t
                        mat2.opacity = view ? t : 1 - t
                    },
                    nb: 20,
                    time: this.params.fadingTime,
                    endCb: () => {
                        this['plane' + name].visible =
                            view && this.params.showPlanes
                        this['grid' + name].visible = view
                        this['updating' + name] = false
                    },
                })
            }
        }

        fade('Bottom', Direction.ZMINUS)
        fade('Top', Direction.ZPLUS)
        fade('East', Direction.XPLUS)
        fade('West', Direction.XMINUS)
        fade('South', Direction.YMINUS)
        fade('North', Direction.YPLUS)
    }

    private canSee(c: Camera, view: Direction) {
        const ray = new Vector3()
        c.getWorldDirection(ray)

        switch (view) {
            case Direction.XPLUS:
                return this.getAngle(ray, Y) > Math.PI ? true : false
            case Direction.XMINUS:
                return this.getAngle(ray, Y) > Math.PI ? false : true
            case Direction.YPLUS:
                return this.getAngle(ray, X) < Math.PI ? true : false
            case Direction.YMINUS:
                return this.getAngle(ray, X) < Math.PI ? false : true
            case Direction.ZPLUS:
                return ray.z >= 0 ? true : false
            default:
                return ray.z >= 0 ? false : true
        }
    }

    private getAngle(v1: Vector3, v2: Vector3) {
        let ang =
            v1.cross(v2).z < 0
                ? TWOPI - Math.acos(v1.dot(v2))
                : Math.acos(v1.dot(v2))
        if (ang >= TWOPI) {
            ang -= TWOPI
        }
        return ang
    }

    private generateGrid(object: Object3D) {
        const b = new Box3()
        b.setFromObject(object)

        const scale = this.params.extendCoef
        const size =
            Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z) *
            this.params.extendCoef
        const sizes = new Vector3(
            (b.max.x - b.min.x) * scale,
            (b.max.y - b.min.y) * scale,
            (b.max.z - b.min.z) * scale,
        )
        const sizeX = sizes.x < 0.3 * size ? 0.3 * size : sizes.x
        const sizeY = sizes.y < 0.3 * size ? 0.3 * size : sizes.y
        const sizeZ = sizes.z < 0.3 * size ? 0.3 * size : sizes.z

        const center = new Vector3()
        b.getCenter(center)

        this.group = new Group()
        this.scene.add(this.group)

        this.groupBottom = new Group()
        this.group.add(this.groupBottom)
        this.groupTop = new Group()
        this.group.add(this.groupTop)
        this.groupNorth = new Group()
        this.group.add(this.groupNorth)
        this.groupSouth = new Group()
        this.group.add(this.groupSouth)
        this.groupEast = new Group()
        this.group.add(this.groupEast)
        this.groupWest = new Group()
        this.group.add(this.groupWest)

        // this.addMarker(1.23, b.min)
        // this.addMarker(1.23, b.max)

        const pos = new Vector3()

        {
            pos.setX(center.x)
                .setY(center.y)
                .setZ(center.z - sizeZ / 2)
            const { grid, plane } = this.generatePlane(sizeX, sizeY, pos)
            this.gridBottom = grid
            this.planeBottom = plane
            this.groupBottom.add(this.gridBottom)
            if (this.params.showPlanes) {
                this.groupBottom.add(this.planeBottom)
            }
        }
        {
            pos.setX(center.x)
                .setY(center.y)
                .setZ(center.z + sizeZ / 2)
            const { grid, plane } = this.generatePlane(sizeX, sizeY, pos)
            this.gridTop = grid
            this.planeTop = plane
            this.groupTop.add(this.gridTop)
            if (this.params.showPlanes) {
                this.groupTop.add(this.planeTop)
            }
        }
        {
            pos.setX(center.x)
                .setY(center.y - sizeY / 2)
                .setZ(center.z)
            const { grid, plane } = this.generatePlane(
                sizeX,
                sizeZ,
                pos,
                'x',
                Math.PI / 2,
            )
            this.gridSouth = grid
            this.planeSouth = plane
            this.groupSouth.add(this.gridSouth)
            if (this.params.showPlanes) {
                this.groupSouth.add(this.planeSouth)
            }
        }
        {
            pos.setX(center.x)
                .setY(center.y + sizeY / 2)
                .setZ(center.z)
            const { grid, plane } = this.generatePlane(
                sizeX,
                sizeZ,
                pos,
                'x',
                Math.PI / 2,
            )
            this.gridNorth = grid
            this.planeNorth = plane
            this.groupNorth.add(this.gridNorth)
            if (this.params.showPlanes) {
                this.groupNorth.add(this.planeNorth)
            }
        }
        {
            pos.setX(center.x - sizeX / 2)
                .setY(center.y)
                .setZ(center.z)
            const { grid, plane } = this.generatePlane(
                sizeZ,
                sizeY,
                pos,
                'y',
                Math.PI / 2,
            )
            this.gridWest = grid
            this.planeWest = plane
            this.groupWest.add(this.gridWest)
            if (this.params.showPlanes) {
                this.groupWest.add(this.planeWest)
            }
        }
        {
            pos.setX(center.x + sizeX / 2)
                .setY(center.y)
                .setZ(center.z)
            const { grid, plane } = this.generatePlane(
                sizeZ,
                sizeY,
                pos,
                'y',
                Math.PI / 2,
            )
            this.gridEast = grid
            this.planeEast = plane
            this.groupEast.add(this.gridEast)
            if (this.params.showPlanes) {
                this.groupEast.add(this.planeEast)
            }
        }

        if (this.params.showBBox) {
            const bbox = new Box3().setFromObject(this.group)
            const size = bbox.getSize(new Vector3())
            const min = Math.min(size.x, size.y, size.z)
            const max = Math.max(size.x, size.y, size.z)
            if (min === 0) {
                bbox.expandByScalar(max / 1e5)
            }
            const skin = new Box3Helper(bbox, new Color('#000'))
            this.group.add(skin)
        }
    }

    private generatePlane(
        sizeX: number,
        sizeY: number,
        pos: Vector3,
        rotAxis: string = undefined,
        rotAngle: number = undefined,
    ) {
        const grid = new GridHelper(
            sizeX,
            sizeY,
            this.params.divisions,
            this.textParams,
        )
        if (rotAxis) {
            this.rotate((grid as LineSegments).rotation, rotAxis, rotAngle)
        }
        const gridAsSegments = grid as LineSegments
        gridAsSegments.position.set(pos.x, pos.y, pos.z)

        const geometry = new PlaneGeometry(sizeX, sizeY)
        const material = new MeshBasicMaterial({
            color: new Color(this.params.color),
            side: DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            transparent: true,
            opacity: this.params.opacity,
        })

        const plane = new Mesh(geometry, material)
        if (rotAxis) {
            this.rotate(plane.rotation, rotAxis, rotAngle)
        }
        plane.position.set(pos.x, pos.y, pos.z)
        plane.visible = this.params.showPlanes
        //plane.receiveShadow = true

        return {
            grid,
            plane,
        }
    }

    private rotate(rotation: Euler, rotAxis: string, rotAngle: number) {
        switch (rotAxis) {
            case 'x':
                rotation.x = rotAngle
                break
            case 'y':
                rotation.y = rotAngle
                break
            case 'z':
                rotation.z = rotAngle
                break
            default:
                throw new Error('unknown axis ' + rotAxis)
        }
    }

    private addMarker(value: number, pos: Vector3) {
        const text =
            Math.abs(value) > 100
                ? value.toFixed(0).toString()
                : value.toFixed(3).toString()
        const s = createTextSprite({
            text,
            position: pos,
            rect: this.textParams.rect,
            rectColor: this.textParams.rectColor,
            fontSize: this.textParams.fontSize,
            fontColor: this.textParams.fontColor,
        })
        this.group.add(s)
    }
}

const X = new Vector3(-1, 0, 0)
const Y = new Vector3(0, -1, 0)
const TWOPI = 2 * Math.PI

enum Direction {
    XPLUS,
    XMINUS,
    YPLUS,
    YMINUS,
    ZPLUS,
    ZMINUS,
}

class GridHelper extends LineSegments {
    constructor(
        sizeX: number,
        sizeY: number,
        divisions: number,
        textParams: GridTextParameters,
        c1 = 0x000000,
        c2 = 0x888888,
    ) {
        super()
        const stepX = sizeX / divisions
        const stepY = sizeY / divisions
        const X2 = sizeX / 2
        const Y2 = sizeY / 2
        const vertices = []

        let k = -X2
        let l = -Y2
        for (let i = 0; i <= divisions; ++i) {
            vertices.push(-X2, l, 0, X2, l, 0)
            vertices.push(k, -Y2, 0, k, Y2, 0)

            if (1) {
                const text =
                    Math.abs(k) > 100
                        ? k.toFixed(0).toString()
                        : k.toFixed(3).toString()
                const s = createTextSprite({
                    text,
                    position: new Vector3(X2, l, 0),
                    rect: textParams.rect,
                    rectColor: textParams.rectColor,
                    fontSize: textParams.fontSize,
                    fontColor: textParams.fontColor,
                })
                this.add(s)
            }

            k += stepX
            l += stepY
        }

        const geometry = new BufferGeometry()
        geometry.setAttribute(
            'position',
            new Float32BufferAttribute(vertices, 3),
        )
        const material = new LineBasicMaterial({
            vertexColors: true,
            toneMapped: false,
        })

        const self = this as LineSegments
        self.geometry = geometry
        self.material = material
        self.type = 'GridHelper'
    }
}
