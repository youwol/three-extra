import {
    Group,
    PointLight,
    Object3D,
    Box3,
    Vector3,
    Sphere,
    DirectionalLight,
    HemisphereLight,
    Mesh,
    SphereGeometry,
    MeshBasicMaterial,
} from 'three'

/**
 * @category Commands
 */
export function createDefaultLights({
    scaling,
    object,
    intensity = 0.5,
}: { scaling?: number; object?: Object3D; intensity?: number } = {}): Group {
    const g = new Group()

    const b = new Box3()
    b.setFromObject(object)

    const sphere = new Sphere()
    b.getBoundingSphere(sphere)

    const radius = sphere.radius
    const center = sphere.center

    // let dir = new Vector3(radius,4*radius,3*radius)
    // //let dir = new Vector3(5,20,12)

    const dir = center.clone()
    dir.add(new Vector3(radius, radius, radius))

    let dirLight = new DirectionalLight(0xaaaaaa)
    dirLight.position.set(dir.x, dir.y, dir.z)
    dirLight.castShadow = false
    g.add(dirLight)

    dirLight = new DirectionalLight(0xaaaaaa)
    dirLight.position.set(dir.x, dir.y, -dir.z)
    dirLight.castShadow = false
    g.add(dirLight)

    // dirLight.shadow.camera.near = 0.01
    // dirLight.shadow.camera.far = 100000
    // dirLight.shadow.mapSize.x = 2048;
    // dirLight.shadow.mapSize.y = 2048;
    //// dirLight.shadow.camera.left = -20;
    //// dirLight.shadow.camera.bottom = -20;
    //// dirLight.shadow.camera.right = 20;
    //// dirLight.shadow.camera.top = 20;

    // DEBUG
    if (0) {
        let size = 200
        const sphere = new Mesh(
            new SphereGeometry(size, 32, 32),
            new MeshBasicMaterial({ color: 0xff0000 }),
        )
        sphere.position.set(dir.x, dir.y, dir.z)
        g.add(sphere)
    }
    //

    // ---------------------------------------------

    const intensitySky = 0.4 // param for flux
    const intensityground = 0.4 // param for flux
    const sky = 0xffffff

    const ground = createGrayColor(intensityground)

    const h1 = new HemisphereLight(sky, ground, intensitySky)
    h1.position.set(0, 10, 10)
    g.add(h1)

    const h2 = new HemisphereLight(sky, ground, intensitySky)
    h2.position.set(0, -10, -10)
    g.add(h2)

    return g
}

function createGrayColor(intensity) {
    if (intensity === 0) {
        return '#000000'
    }
    const value = (intensity * 0xff) | 0
    const grayscale = (value << 16) | (value << 8) | value
    const gray = grayscale.toString(16)
    return gray.length === 5 ? '#0' + gray : '#' + gray
}
