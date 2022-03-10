import { Box3, Vector3, PerspectiveCamera, Object3D, Camera } from 'three'
//import { TrackballControls } from '../TrackballControls.ts.OLD'
import TrackballControls from 'three-trackballcontrols'

/**
 * Fit a scene or a specific object or array of objects.
 * The default value for the fitRatio is 1.2
 * @example
 * ```ts
 * threeExtra.fitScene( {scene, camera, controls} )
 * ```
 * @category Commands
 */
export function fitScene(
    {scene, camera, controls, selection, fitRatio} : 
    {
        scene?: any, 
        camera: Camera, 
        controls: TrackballControls, 
        selection?: Object3D[] | Object3D, 
        fitRatio?: number
})
{
    if (!camera) throw new Error('Missing camera')
    if (!controls) throw new Error('Missing control')
    if ( !(camera instanceof PerspectiveCamera) ) throw new Error('Ortho camera not suppported yet')

    if (selection===undefined && !scene) throw new Error('Missing scene or selection array')

    selection = selection!==undefined ? selection : scene.children
    fitRatio  = fitRatio!==undefined ? fitRatio : 1.2

    const box = new Box3()
    
    if (! Array.isArray(selection)) {
        box.expandByObject(selection)
    }
    else {
        selection.forEach( (mesh: any) => {
            if (mesh instanceof Object3D) {
                box.expandByObject(mesh)
            }
        })
    }

    const size   = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())

    const maxSize = Math.max(size.x, size.y, size.z)
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360))
    const fitWidthDistance = fitHeightDistance / camera.aspect
    const distance = fitRatio * Math.max(fitHeightDistance, fitWidthDistance)

    const direction = controls.target
        .clone()
        .sub(camera.position)
        .normalize()
        .multiplyScalar(distance)

    controls.maxDistance = distance * 10
    controls.target.copy(center)
    camera.near = distance / 100
    camera.far  = distance * 100
    camera.updateProjectionMatrix()
    camera.position.copy(controls.target).sub(direction)
    controls.update()
}
