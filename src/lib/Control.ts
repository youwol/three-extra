import { Camera, Vector3 } from 'three'

/**
 * Known controls can be either TrackballControls or OrbitControls.
 * User control must follow this interface in order to be used in three-extra.
 * See [THREE.TrackballControls](https://threejs.org/docs/#examples/en/controls/TrackballControls)
 * or [THREE.OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)
 * for more information about the properties and the `update()` method.
 */
export interface Controls {
    target: Vector3
    object: Camera
    maxDistance: number
    update()
}
