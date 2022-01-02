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
    ShadowMaterial, 
    Vector3, 
    WebGLRenderer
} from 'three'
//import { createTextSprite } from './createTextSprite'
import { animate }          from '../animationLoop'
import { RenderFunctions }  from '../renderFunctions'
import { createText2D } from './createText2D'

export class GridHeplerParameters {
    renderFunctions: RenderFunctions
    scene     : Scene
    camera    : Camera
	renderer  : WebGLRenderer
    extendCoef: number
    fading    : boolean
    fadingTime: number
    showPlanes: boolean
    opacity   : number
    color     : string
    showBBox  : boolean
    divisions : number

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
        divisions
    }:{
        scene: Scene, 
        camera: Camera, 
        renderer: WebGLRenderer, 
        renderFunctions: RenderFunctions,
        extendCoef  ?: number,
        fading      ?: boolean,
        fadingTime  ?: number,
        showPlanes  ?: boolean,
        color       ?: string,
        showBBox    ?: boolean,
        divisions   ?: number
    })
    {
		this.scene 		 = scene
		this.camera 	 = camera
		this.renderer 	 = renderer
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

export function createGridHelper(object: Object3D, params: GridHeplerParameters) {
    return new GridsHelper(object, params)
}

/*
TODO:
    - separate the size for each axis
    - axis size should be greater than 30% of the max axis size
*/

class GridsHelper {
    private uuidFct   : string
    private gridNorth : GridHelper
    private gridSouth : GridHelper
    private gridWest  : GridHelper
    private gridEast  : GridHelper
    private gridTop   : GridHelper
    private gridBottom: GridHelper
    private planeNorth : Mesh
    private planeSouth : Mesh
    private planeWest  : Mesh
    private planeEast  : Mesh
    private planeTop   : Mesh
    private planeBottom: Mesh
    private renderFunctions: RenderFunctions = undefined
    private renderer       : WebGLRenderer = undefined
    private scene          : Scene = undefined
    private camera         : Camera = undefined
    private group          : Group = undefined
    private params: GridHeplerParameters = undefined
    private updatingBottom = false
    private updatingTop    = false
    private updatingEast   = false
    private updatingWest   = false
    private updatingNorth  = false
    private updatingSouth  = false

    constructor(object: Object3D, params: GridHeplerParameters) {
        this.renderFunctions = params.renderFunctions
        this.renderer        = params.renderer
        this.camera          = params.camera
        this.scene           = params.scene
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
        if (this.params.fading===false) {
            {
                const ok = this.canSee(this.camera, Direction.XPLUS)
                this.gridEast.visible = ok
                this.planeEast.visible = ok && this.params.showPlanes
            }
            {
                const ok = this.canSee(this.camera, Direction.XMINUS)
                this.gridWest.visible = ok
                this.planeWest.visible = ok && this.params.showPlanes
            }
            {
                const ok = this.canSee(this.camera, Direction.YMINUS)
                this.gridSouth.visible = ok
                this.planeSouth.visible = ok && this.params.showPlanes
            }
            {
                const ok = this.canSee(this.camera, Direction.YPLUS)
                this.gridNorth.visible = ok
                this.planeNorth.visible = ok && this.params.showPlanes
            }
            {
                const ok = this.canSee(this.camera, Direction.ZPLUS)
                this.gridTop.visible = ok
                this.planeTop.visible = ok && this.params.showPlanes
            }
            {
                const ok = this.canSee(this.camera, Direction.ZMINUS)
                this.gridBottom.visible = ok
                this.planeBottom.visible = ok && this.params.showPlanes
            }            
            return
        }

        const fade = (name: string, dir: Direction) => {
            const view = this.canSee(this.camera, dir)

            if (!this["updating"+name] && this["grid"+name].visible !== view) {
                const material = this["plane"+name].material as Material ;
                this["updating"+name] = true

                if (this["plane"+name].visible === false) {
                    material.opacity = 0
                }
                else {
                    this["grid"+name].visible = false
                }

                animate({
                    cb: (t:number) => {
                        material.opacity = view ? t : (1-t)
                    }, 
                    nb:20, 
                    time: this.params.fadingTime,
                    endCb: () => {
                        this["plane"+name].visible = view && this.params.showPlanes
                        this["grid"+name].visible  = view
                        this["updating"+name]      = false
                    }
                })
            }
        }

        fade("Bottom", Direction.ZMINUS)
        fade("Top"   , Direction.ZPLUS)
        fade("East"  , Direction.XPLUS)
        fade("West"  , Direction.XMINUS)
        fade("South" , Direction.YMINUS)
        fade("North" , Direction.YPLUS)
    }

    canSee(c: Camera, view: Direction) {
        const ray = new Vector3()
        c.getWorldDirection(ray)

        switch (view) {
            case Direction.XPLUS : return this.getAngle(ray, Y) > Math.PI ? true : false
            case Direction.XMINUS: return this.getAngle(ray, Y) > Math.PI ? false : true
            case Direction.YPLUS : return this.getAngle(ray, X) < Math.PI ? true : false
            case Direction.YMINUS: return this.getAngle(ray, X) < Math.PI ? false : true
            case Direction.ZPLUS : return ray.z >= 0 ? true : false
            default              : return ray.z >= 0 ? false : true
        }
    }

    getAngle(v1: Vector3, v2: Vector3) {
        let ang = (v1.cross(v2).z < 0 ? TWOPI - Math.acos(v1.dot(v2)) : Math.acos(v1.dot(v2)))
        if (ang >= TWOPI) ang -= TWOPI
        return ang
    }

    generateGrid(object: Object3D) {
        const b = new Box3
        b.setFromObject(object)

        const scale = this.params.extendCoef
        const size = Math.max(b.max.x-b.min.x, b.max.y-b.min.y, b.max.z-b.min.z)*this.params.extendCoef
        const sizes = new Vector3((b.max.x-b.min.x)*scale, (b.max.y-b.min.y)*scale, (b.max.z-b.min.z)*scale)
        const sizeX = sizes.x < 0.3*size ? 0.3*size : sizes.x ;
        const sizeY = sizes.y < 0.3*size ? 0.3*size : sizes.y ;
        const sizeZ = sizes.z < 0.3*size ? 0.3*size : sizes.z ;

        const center = new Vector3
        b.getCenter(center)

        this.group = new Group
        this.scene.add(this.group)

        let pos = new Vector3

        {
            pos.setX(center.x).setY(center.y).setZ(center.z-sizeZ/2)
            const {grid, plane} = this.generatePlane(sizeX, sizeY, pos)
            this.gridBottom  = grid
            this.planeBottom = plane
            this.group.add(this.gridBottom)
            this.group.add(this.planeBottom)
        }
        {
            pos.setX(center.x).setY(center.y).setZ(center.z+sizeZ/2)
            const {grid, plane} = this.generatePlane(sizeX, sizeY, pos)
            this.gridTop  = grid
            this.planeTop = plane
            this.group.add(this.gridTop)
            this.group.add(this.planeTop)
        }
        {
            pos.setX(center.x).setY(center.y-sizeY/2).setZ(center.z)
            const {grid, plane} = this.generatePlane(sizeX, sizeZ, pos, 'x', Math.PI/2)
            this.gridSouth  = grid
            this.planeSouth = plane
            this.group.add(this.gridSouth)
            this.group.add(this.planeSouth)
        }
        {
            pos.setX(center.x).setY(center.y+sizeY/2).setZ(center.z)
            const {grid, plane} = this.generatePlane(sizeX, sizeZ, pos, 'x', Math.PI/2)
            this.gridNorth  = grid
            this.planeNorth = plane
            this.group.add(this.gridNorth)
            this.group.add(this.planeNorth)
        }
        {
            pos.setX(center.x-sizeX/2).setY(center.y).setZ(center.z)
            const {grid, plane} = this.generatePlane(sizeZ, sizeY, pos, 'y', Math.PI/2)
            this.gridWest  = grid
            this.planeWest = plane
            this.group.add(this.gridWest)
            this.group.add(this.planeWest)
        }
        {
            pos.setX(center.x+sizeX/2).setY(center.y).setZ(center.z)
            const {grid, plane} = this.generatePlane(sizeZ, sizeY, pos, 'y', Math.PI/2)
            this.gridEast  = grid
            this.planeEast = plane
            this.group.add(this.gridEast)
            this.group.add(this.planeEast)
        }

        if (this.params.showBBox) {
            const bbox = new Box3().setFromObject(this.group)
            const size = bbox.getSize(new Vector3)
            const min = Math.min(size.x, size.y, size.z)
            const max = Math.max(size.x, size.y, size.z)
            if (min===0) {
                bbox.expandByScalar(max/1e5)
            }
            const skin = new Box3Helper(bbox, new Color('#000'))
            this.group.add(skin)
        }
    }

    generatePlane(sizeX: number, sizeY: number, pos: Vector3, rotAxis: string=undefined, rotAngle: number=undefined) {
        const grid = new GridHelper(sizeX, sizeY, this.params.divisions)
        if (rotAxis) this.rotate(grid.rotation, rotAxis, rotAngle)
        grid.position.set(pos.x, pos.y, pos.z)

        const geometry = new PlaneGeometry(sizeX, sizeY)
        const material = new MeshBasicMaterial({
            color: new Color(this.params.color), 
            side: DoubleSide, 
            polygonOffset: true, 
            polygonOffsetFactor: 1,
            transparent: true,
            opacity: this.params.opacity
        })

        const plane = new Mesh( geometry, material )
        if (rotAxis) this.rotate(plane.rotation, rotAxis, rotAngle)
        plane.position.set(pos.x, pos.y, pos.z)
        plane.visible = this.params.showPlanes
        //plane.receiveShadow = true

        return {
            grid,
            plane
        }
    }

    rotate(rotation: Euler, rotAxis: string, rotAngle: number) {
        switch(rotAxis) {
            case 'x': rotation.x = rotAngle; break;
            case 'y': rotation.y = rotAngle; break;
            case 'z': rotation.z = rotAngle; break;
            default: throw new Error('unknown axis '+rotAxis)
        }
    }
}

const X = new Vector3(-1, 0, 0)
const Y = new Vector3(0, -1, 0)
const TWOPI = 2*Math.PI

enum Direction {
    XPLUS,
    XMINUS,
    YPLUS,
    YMINUS,
    ZPLUS,
    ZMINUS
}

class GridHelper extends LineSegments {
	constructor( sizeX: number, sizeY: number, divisions: number, c1 = 0x000000, c2 = 0x888888 ) {
        super()
		const color1 = new Color( c1 );
		const color2 = new Color( c2 );
		const center = divisions / 2;
		const stepX = sizeX / divisions;
        const stepY = sizeY / divisions;
		const halfSizeX = sizeX / 2;
        const halfSizeY = sizeY / 2;
		const vertices = [], colors = [];
        let k = -halfSizeX
        let l = -halfSizeY

		for ( let i = 0, j = 0; i <= divisions; i ++ ) {
			vertices.push( - halfSizeX, l, 0, halfSizeX, l, 0 );
			vertices.push( k, - halfSizeY, 0, k, halfSizeY, 0 );
			const color = i === center ? color1 : color2;
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
            k += stepX ;
            l += stepY ;

            // const s = createText2D(k.toFixed(3).toString())
            // s.scale.set(10,10,10)
            // s.position.set(- halfSizeX, l, 0)
            // this.add(s)
		}
        
		const geometry = new BufferGeometry()
		geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) )
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) )
		const material = new LineBasicMaterial( { vertexColors: true, toneMapped: false } )

        this.geometry = geometry
        this.material = material

		this.type = 'GridHelper'
	}
}
