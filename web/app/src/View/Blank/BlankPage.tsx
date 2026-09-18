import React from "react"
import * as styles from "./BlankPage.styles.css"

/**
 * The spaceboy starter — the first page every new project shows. Pure scene,
 * no copy: a boy on a grassy hill crest holding the moon on a string, the
 * brand artwork (the spaceboy app-icon render) staged as a night scene.
 * Replace it with the app's real home once the product has one.
 *
 * MIRROR: the workspace shows this exact scene client-side while the pod
 * boots (main repo, web/app/src/View/Dashboard/VibeSession/SpaceboyScene.tsx)
 * so the crossfade to the live preview is invisible. The workspace cannot
 * import kernel views — if you change the art here, change it there too,
 * including the portrait recomposition below (the workspace mobile preview
 * toggle frames this page at phone width).
 * The geometry below is baked from the local iteration playground
 * (spaceboy-placeholder/index.html); iterate there, then re-bake.
 */

/**
 * Deterministic star field (seeded PRNG, not Math.random) so the sky is
 * identical on every render and screenshot.
 */
function starField(): Array<{ left: string; top: string; size: number; duration: string; delay: string }> {
    let seed = 0x5eedb0
    const next = (): number => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
    }
    return Array.from({ length: 80 }, () => ({
        left: `${(next() * 100).toFixed(2)}%`,
        // Keep stars in the sky: the bottom of the frame belongs to the hill.
        top: `${(next() * 72).toFixed(2)}%`,
        size: 1 + next() * 1.6,
        duration: `${(2 + next() * 4).toFixed(1)}s`,
        delay: `${(next() * 3).toFixed(1)}s`,
    }))
}

const stars = starField()

// The silhouette ink: hill, grass, and boy are one cutout color.
const ink = "#06070b"

/**
 * The boy, traced from the spaceboy app-icon artwork: standing on the crest,
 * face tipped up, one arm raised holding the string with an open hand.
 * Local bounding box is 132 x 211; feet at local y=211 (a flat cut that
 * sinks a few px into the hill), hand at local (110, 9).
 */
const boyPath =
    "M45.0,0.0C45.2,0.2 43.8,2.2 44.0,3.0C44.2,3.8 45.2,4.8 46.0,5.0C46.8,5.2 48.0,4.3 49.0,4.0C50.0,3.7 51.7,2.8 52.0,3.0C52.3,3.2 50.8,4.3 51.0,5.0C51.2,5.7 52.2,6.5 53.0,7.0C53.8,7.5 55.0,7.7 56.0,8.0C57.0,8.3 58.8,8.8 59.0,9.0C59.2,9.2 57.3,8.5 57.0,9.0C56.7,9.5 56.7,11.0 57.0,12.0C57.3,13.0 58.7,14.0 59.0,15.0C59.3,16.0 59.5,17.7 59.0,18.0C58.5,18.3 56.3,16.7 56.0,17.0C55.7,17.3 56.7,19.0 57.0,20.0C57.3,21.0 57.8,22.0 58.0,23.0C58.2,24.0 57.8,25.0 58.0,26.0C58.2,27.0 58.5,28.2 59.0,29.0C59.5,29.8 60.2,30.3 61.0,31.0C61.8,31.7 63.7,32.2 64.0,33.0C64.3,33.8 63.0,35.0 63.0,36.0C63.0,37.0 64.0,38.0 64.0,39.0C64.0,40.0 63.2,41.0 63.0,42.0C62.8,43.0 63.0,44.0 63.0,45.0C63.0,46.0 63.3,47.0 63.0,48.0C62.7,49.0 61.8,50.3 61.0,51.0C60.2,51.7 59.0,51.7 58.0,52.0C57.0,52.3 56.0,52.5 55.0,53.0C54.0,53.5 52.7,54.2 52.0,55.0C51.3,55.8 51.0,57.0 51.0,58.0C51.0,59.0 51.3,60.7 52.0,61.0C52.7,61.3 54.0,60.3 55.0,60.0C56.0,59.7 57.0,59.5 58.0,59.0C59.0,58.5 60.0,57.5 61.0,57.0C62.0,56.5 63.0,56.5 64.0,56.0C65.0,55.5 66.0,54.7 67.0,54.0C68.0,53.3 69.0,52.7 70.0,52.0C71.0,51.3 72.0,50.3 73.0,50.0C74.0,49.7 75.0,50.5 76.0,50.0C77.0,49.5 78.2,48.0 79.0,47.0C79.8,46.0 80.2,45.0 81.0,44.0C81.8,43.0 83.0,42.0 84.0,41.0C85.0,40.0 86.0,38.8 87.0,38.0C88.0,37.2 89.0,36.8 90.0,36.0C91.0,35.2 92.0,34.0 93.0,33.0C94.0,32.0 95.0,31.0 96.0,30.0C97.0,29.0 98.2,28.0 99.0,27.0C99.8,26.0 100.8,25.0 101.0,24.0C101.2,23.0 100.2,22.0 100.0,21.0C99.8,20.0 100.0,19.0 100.0,18.0C100.0,17.0 99.8,15.7 100.0,15.0C100.2,14.3 100.7,13.7 101.0,14.0C101.3,14.3 101.3,16.5 102.0,17.0C102.7,17.5 104.2,17.5 105.0,17.0C105.8,16.5 106.3,15.0 107.0,14.0C107.7,13.0 108.3,11.8 109.0,11.0C109.7,10.2 110.8,8.8 111.0,9.0C111.2,9.2 110.5,11.0 110.0,12.0C109.5,13.0 108.0,14.2 108.0,15.0C108.0,15.8 109.2,17.2 110.0,17.0C110.8,16.8 112.0,14.8 113.0,14.0C114.0,13.2 116.0,11.8 116.0,12.0C116.0,12.2 113.8,14.0 113.0,15.0C112.2,16.0 110.8,17.3 111.0,18.0C111.2,18.7 113.0,19.0 114.0,19.0C115.0,19.0 116.3,18.2 117.0,18.0C117.7,17.8 118.3,17.8 118.0,18.0C117.7,18.2 116.0,18.3 115.0,19.0C114.0,19.7 112.2,21.2 112.0,22.0C111.8,22.8 113.5,23.7 114.0,24.0C114.5,24.3 115.3,23.8 115.0,24.0C114.7,24.2 113.0,24.5 112.0,25.0C111.0,25.5 110.0,26.5 109.0,27.0C108.0,27.5 107.0,27.3 106.0,28.0C105.0,28.7 104.0,30.0 103.0,31.0C102.0,32.0 100.8,33.0 100.0,34.0C99.2,35.0 98.7,36.0 98.0,37.0C97.3,38.0 96.7,39.0 96.0,40.0C95.3,41.0 94.8,42.0 94.0,43.0C93.2,44.0 92.0,45.0 91.0,46.0C90.0,47.0 89.0,48.0 88.0,49.0C87.0,50.0 86.0,51.2 85.0,52.0C84.0,52.8 83.0,53.2 82.0,54.0C81.0,54.8 79.8,56.0 79.0,57.0C78.2,58.0 77.3,59.0 77.0,60.0C76.7,61.0 76.8,62.0 77.0,63.0C77.2,64.0 78.2,65.0 78.0,66.0C77.8,67.0 76.8,68.2 76.0,69.0C75.2,69.8 74.0,70.2 73.0,71.0C72.0,71.8 71.0,73.2 70.0,74.0C69.0,74.8 68.0,75.2 67.0,76.0C66.0,76.8 64.5,78.0 64.0,79.0C63.5,80.0 64.0,81.0 64.0,82.0C64.0,83.0 63.8,84.0 64.0,85.0C64.2,86.0 64.8,87.0 65.0,88.0C65.2,89.0 65.0,90.0 65.0,91.0C65.0,92.0 64.8,93.0 65.0,94.0C65.2,95.0 65.8,96.0 66.0,97.0C66.2,98.0 66.0,99.0 66.0,100.0C66.0,101.0 65.8,102.0 66.0,103.0C66.2,104.0 66.8,105.0 67.0,106.0C67.2,107.0 66.8,108.0 67.0,109.0C67.2,110.0 67.8,111.0 68.0,112.0C68.2,113.0 68.0,114.0 68.0,115.0C68.0,116.0 67.8,117.0 68.0,118.0C68.2,119.0 68.8,120.0 69.0,121.0C69.2,122.0 69.5,123.3 69.0,124.0C68.5,124.7 66.8,124.5 66.0,125.0C65.2,125.5 64.3,126.2 64.0,127.0C63.7,127.8 63.8,129.0 64.0,130.0C64.2,131.0 64.8,132.0 65.0,133.0C65.2,134.0 65.0,135.0 65.0,136.0C65.0,137.0 65.0,138.0 65.0,139.0C65.0,140.0 64.8,141.0 65.0,142.0C65.2,143.0 65.8,144.0 66.0,145.0C66.2,146.0 66.0,147.0 66.0,148.0C66.0,149.0 65.8,150.0 66.0,151.0C66.2,152.0 66.8,153.0 67.0,154.0C67.2,155.0 67.0,156.0 67.0,157.0C67.0,158.0 67.0,159.0 67.0,160.0C67.0,161.0 67.3,162.3 67.0,163.0C66.7,163.7 65.8,163.7 65.0,164.0C64.2,164.3 62.8,164.5 62.0,165.0C61.2,165.5 60.5,166.2 60.0,167.0C59.5,167.8 59.2,169.0 59.0,170.0C58.8,171.0 59.0,172.0 59.0,173.0C59.0,174.0 59.2,175.0 59.0,176.0C58.8,177.0 58.2,178.0 58.0,179.0C57.8,180.0 58.0,181.0 58.0,182.0C58.0,183.0 58.2,184.0 58.0,185.0C57.8,186.0 57.2,187.0 57.0,188.0C56.8,189.0 57.0,190.0 57.0,191.0C57.0,192.0 57.2,193.0 57.0,194.0C56.8,195.0 56.2,196.0 56.0,197.0C55.8,198.0 55.5,199.3 56.0,200.0C56.5,200.7 58.2,200.3 59.0,201.0C59.8,201.7 60.2,203.3 61.0,204.0C61.8,204.7 63.0,204.7 64.0,205.0C65.0,205.3 66.0,205.7 67.0,206.0C68.0,206.3 69.2,206.3 70.0,207.0C70.8,207.7 71.2,209.5 72.0,210.0C72.8,210.5 74.0,210.0 75.0,210.0C76.0,210.0 77.0,209.8 78.0,210.0C79.0,210.2 80.0,210.8 81.0,211.0C82.0,211.2 83.7,211.0 84.0,211.0L2.0,211.0C1.2,210.8 -0.2,210.0 0.0,210.0C0.2,210.0 2.0,210.8 3.0,211.0C4.0,211.2 5.3,211.2 6.0,211.0C6.7,210.8 6.3,210.0 7.0,210.0C7.7,210.0 9.0,211.0 10.0,211.0C11.0,211.0 12.0,210.2 13.0,210.0C14.0,209.8 15.2,210.5 16.0,210.0C16.8,209.5 17.7,208.0 18.0,207.0C18.3,206.0 17.8,205.0 18.0,204.0C18.2,203.0 18.5,201.8 19.0,201.0C19.5,200.2 20.5,199.8 21.0,199.0C21.5,198.2 21.8,197.0 22.0,196.0C22.2,195.0 22.0,194.0 22.0,193.0C22.0,192.0 22.0,191.0 22.0,190.0C22.0,189.0 22.0,188.0 22.0,187.0C22.0,186.0 22.0,185.0 22.0,184.0C22.0,183.0 22.0,182.0 22.0,181.0C22.0,180.0 21.8,179.0 22.0,178.0C22.2,177.0 22.7,176.0 23.0,175.0C23.3,174.0 23.7,173.0 24.0,172.0C24.3,171.0 24.7,170.0 25.0,169.0C25.3,168.0 26.2,166.8 26.0,166.0C25.8,165.2 24.8,164.5 24.0,164.0C23.2,163.5 21.7,163.7 21.0,163.0C20.3,162.3 20.0,161.0 20.0,160.0C20.0,159.0 20.7,158.0 21.0,157.0C21.3,156.0 21.8,155.0 22.0,154.0C22.2,153.0 21.8,152.0 22.0,151.0C22.2,150.0 22.7,149.0 23.0,148.0C23.3,147.0 23.8,146.0 24.0,145.0C24.2,144.0 23.8,143.0 24.0,142.0C24.2,141.0 24.8,140.0 25.0,139.0C25.2,138.0 24.8,137.0 25.0,136.0C25.2,135.0 25.8,134.0 26.0,133.0C26.2,132.0 26.2,131.0 26.0,130.0C25.8,129.0 25.3,127.8 25.0,127.0C24.7,126.2 24.0,125.8 24.0,125.0C24.0,124.2 24.7,123.0 25.0,122.0C25.3,121.0 25.8,120.0 26.0,119.0C26.2,118.0 25.8,117.0 26.0,116.0C26.2,115.0 26.7,114.0 27.0,113.0C27.3,112.0 27.8,111.0 28.0,110.0C28.2,109.0 28.0,108.0 28.0,107.0C28.0,106.0 27.8,105.0 28.0,104.0C28.2,103.0 29.2,101.8 29.0,101.0C28.8,100.2 27.8,99.2 27.0,99.0C26.2,98.8 24.8,99.3 24.0,100.0C23.2,100.7 22.5,102.0 22.0,103.0C21.5,104.0 21.2,105.0 21.0,106.0C20.8,107.0 21.2,108.0 21.0,109.0C20.8,110.0 20.3,111.0 20.0,112.0C19.7,113.0 19.3,114.0 19.0,115.0C18.7,116.0 18.3,117.0 18.0,118.0C17.7,119.0 17.2,120.0 17.0,121.0C16.8,122.0 17.0,123.0 17.0,124.0C17.0,125.0 16.8,126.0 17.0,127.0C17.2,128.0 17.7,129.0 18.0,130.0C18.3,131.0 18.8,132.0 19.0,133.0C19.2,134.0 19.0,135.0 19.0,136.0C19.0,137.0 19.0,139.0 19.0,139.0C19.0,139.0 19.5,136.7 19.0,136.0C18.5,135.3 16.7,134.7 16.0,135.0C15.3,135.3 15.0,137.0 15.0,138.0C15.0,139.0 16.0,140.3 16.0,141.0C16.0,141.7 15.5,141.7 15.0,142.0C14.5,142.3 13.7,143.3 13.0,143.0C12.3,142.7 11.5,141.0 11.0,140.0C10.5,139.0 10.0,138.0 10.0,137.0C10.0,136.0 10.7,135.0 11.0,134.0C11.3,133.0 11.8,132.0 12.0,131.0C12.2,130.0 11.8,129.0 12.0,128.0C12.2,127.0 12.8,126.0 13.0,125.0C13.2,124.0 13.0,123.0 13.0,122.0C13.0,121.0 13.0,120.0 13.0,119.0C13.0,118.0 12.8,117.0 13.0,116.0C13.2,115.0 13.8,114.0 14.0,113.0C14.2,112.0 14.0,111.0 14.0,110.0C14.0,109.0 13.8,108.0 14.0,107.0C14.2,106.0 14.7,105.0 15.0,104.0C15.3,103.0 15.7,102.0 16.0,101.0C16.3,100.0 16.7,99.0 17.0,98.0C17.3,97.0 18.3,95.8 18.0,95.0C17.7,94.2 15.3,93.8 15.0,93.0C14.7,92.2 15.5,91.0 16.0,90.0C16.5,89.0 17.3,88.0 18.0,87.0C18.7,86.0 19.5,85.0 20.0,84.0C20.5,83.0 20.5,82.0 21.0,81.0C21.5,80.0 22.5,79.0 23.0,78.0C23.5,77.0 23.5,76.0 24.0,75.0C24.5,74.0 25.2,73.0 26.0,72.0C26.8,71.0 28.0,69.8 29.0,69.0C30.0,68.2 31.0,67.7 32.0,67.0C33.0,66.3 34.0,65.5 35.0,65.0C36.0,64.5 37.3,64.7 38.0,64.0C38.7,63.3 38.8,62.0 39.0,61.0C39.2,60.0 39.5,58.7 39.0,58.0C38.5,57.3 37.0,57.2 36.0,57.0C35.0,56.8 34.0,57.2 33.0,57.0C32.0,56.8 31.0,56.3 30.0,56.0C29.0,55.7 28.0,55.3 27.0,55.0C26.0,54.7 25.0,54.5 24.0,54.0C23.0,53.5 22.0,52.8 21.0,52.0C20.0,51.2 18.8,49.3 18.0,49.0C17.2,48.7 16.7,50.3 16.0,50.0C15.3,49.7 14.7,48.0 14.0,47.0C13.3,46.0 12.3,45.0 12.0,44.0C11.7,43.0 12.2,42.0 12.0,41.0C11.8,40.0 11.5,38.3 11.0,38.0C10.5,37.7 9.3,38.7 9.0,39.0C8.7,39.3 9.2,40.3 9.0,40.0C8.8,39.7 8.2,38.0 8.0,37.0C7.8,36.0 7.8,35.0 8.0,34.0C8.2,33.0 8.7,32.0 9.0,31.0C9.3,30.0 9.7,29.0 10.0,28.0C10.3,27.0 11.3,25.5 11.0,25.0C10.7,24.5 8.2,25.3 8.0,25.0C7.8,24.7 9.2,23.7 10.0,23.0C10.8,22.3 12.5,21.8 13.0,21.0C13.5,20.2 13.0,19.0 13.0,18.0C13.0,17.0 12.8,16.0 13.0,15.0C13.2,14.0 13.8,12.3 14.0,12.0C14.2,11.7 14.0,12.3 14.0,13.0C14.0,13.7 13.5,15.7 14.0,16.0C14.5,16.3 16.2,15.7 17.0,15.0C17.8,14.3 18.2,13.0 19.0,12.0C19.8,11.0 21.0,9.8 22.0,9.0C23.0,8.2 24.0,7.5 25.0,7.0C26.0,6.5 27.0,6.3 28.0,6.0C29.0,5.7 30.0,5.3 31.0,5.0C32.0,4.7 33.0,4.2 34.0,4.0C35.0,3.8 36.0,4.0 37.0,4.0C38.0,4.0 39.0,4.3 40.0,4.0C41.0,3.7 42.2,2.7 43.0,2.0C43.8,1.3 44.8,-0.2 45.0,0.0Z"

// ---- Baked scene geometry (from the spaceboy-placeholder playground) ----

// The hill: a rounded crest at the left (where the boy stands) sweeping
// down toward the right.
const hillPath =
    "M0,900 L0,822 C23.3,813.7 85.0,783.7 140.0,772.0 C195.0,760.3 266.7,751.7 330.0,752.0 C393.3,752.3 458.3,762.7 520.0,774.0 C581.7,785.3 636.7,806.3 700.0,820.0 C763.3,833.7 825.0,847.3 900.0,856.0 C975.0,864.7 1060.0,868.0 1150.0,872.0 C1240.0,876.0 1391.7,878.7 1440.0,880.0 L1440,900 Z"

// Feet on the crest (sunk 5px so the trace's flat cut never shows).
const boyTransform = "translate(285, 613.5) scale(0.68)"

// The string: a lazy dotted drape from his hand to the moon's lower-left rim.
const stringPath = "M359.8,619.6 Q655.1,605.2 950.3,326.7"

const moon = { cx: 1030, cy: 275, r: 95, haloR: 228, blur: 4.3 }

// Painterly maria: soft organic patches, blurred and clipped to the disc.
const mariaPatches: Array<{ d: string; opacity: number }> = [
    {
        d: "M1029.7,245.7C1029.0,253.3 1021.8,266.6 1016.6,268.7C1011.3,270.9 1003.5,261.4 998.3,258.9C993.1,256.3 990.7,255.8 985.4,253.3C980.1,250.7 966.8,247.6 966.6,243.6C966.3,239.7 980.3,233.1 983.8,229.5C987.3,225.9 984.4,224.6 987.6,222.0C990.8,219.3 997.5,213.2 1003.0,213.5C1008.5,213.8 1016.4,218.3 1020.8,223.7C1025.3,229.1 1030.4,238.2 1029.7,245.7Z",
        opacity: 0.32,
    },
    {
        d: "M1072.4,245.9C1072.2,250.9 1070.0,259.5 1067.6,263.2C1065.2,266.9 1063.5,267.0 1058.0,268.1C1052.5,269.3 1038.7,273.8 1034.7,270.0C1030.8,266.3 1035.6,253.5 1034.4,245.8C1033.2,238.1 1025.8,227.1 1027.4,223.9C1029.0,220.7 1039.0,227.1 1044.3,226.5C1049.6,225.9 1054.9,219.2 1059.0,220.3C1063.1,221.4 1066.7,228.8 1069.0,233.0C1071.2,237.3 1072.7,240.9 1072.4,245.9Z",
        opacity: 0.28,
    },
    {
        d: "M1089.9,281.1C1090.1,283.9 1092.3,287.7 1090.2,290.3C1088.0,292.9 1080.8,297.0 1076.9,296.6C1073.0,296.2 1068.8,290.2 1066.7,288.0C1064.7,285.7 1064.8,285.3 1064.4,283.0C1064.1,280.7 1063.4,276.8 1064.5,273.9C1065.5,271.1 1067.0,267.5 1070.8,265.8C1074.5,264.0 1083.8,262.1 1086.8,263.4C1089.9,264.7 1088.7,270.7 1089.2,273.7C1089.7,276.6 1089.7,278.3 1089.9,281.1Z",
        opacity: 0.3,
    },
    {
        d: "M1047.4,270.7C1046.4,272.8 1042.2,275.4 1039.7,276.8C1037.1,278.1 1035.8,277.3 1031.9,279.0C1028.0,280.6 1018.2,287.7 1016.1,286.7C1014.0,285.7 1019.3,277.2 1019.3,273.1C1019.3,268.9 1014.7,263.7 1016.3,261.6C1018.0,259.6 1025.8,261.6 1029.0,260.8C1032.3,260.0 1033.2,256.2 1035.9,256.7C1038.7,257.3 1043.7,261.8 1045.6,264.1C1047.5,266.4 1048.3,268.6 1047.4,270.7Z",
        opacity: 0.22,
    },
    {
        d: "M1012.6,295.0C1011.3,299.1 1003.4,298.9 999.6,300.6C995.8,302.2 993.2,304.9 989.7,304.9C986.2,304.9 981.8,303.2 978.8,300.6C975.8,298.0 972.8,293.1 971.8,289.3C970.9,285.6 970.9,281.0 973.0,278.3C975.2,275.5 981.2,273.5 984.5,272.9C987.9,272.2 989.5,274.0 993.3,274.5C997.1,275.0 1004.1,272.4 1007.4,275.8C1010.6,279.3 1013.9,290.9 1012.6,295.0Z",
        opacity: 0.3,
    },
    {
        d: "M1077.7,321.2C1075.9,326.8 1063.5,326.1 1058.4,327.8C1053.4,329.4 1051.7,329.6 1047.3,331.1C1042.9,332.6 1035.8,338.6 1032.0,336.7C1028.2,334.7 1026.6,324.9 1024.7,319.4C1022.8,313.8 1018.2,307.2 1020.4,303.4C1022.6,299.5 1032.1,297.6 1037.8,296.5C1043.4,295.3 1049.1,297.0 1054.3,296.6C1059.5,296.3 1064.9,290.1 1068.8,294.2C1072.7,298.3 1079.4,315.6 1077.7,321.2Z",
        opacity: 0.28,
    },
    {
        d: "M1032.0,326.1C1031.7,329.0 1030.4,333.7 1028.4,335.7C1026.3,337.7 1022.9,338.2 1019.7,337.9C1016.5,337.6 1011.7,335.4 1009.3,333.8C1006.8,332.2 1004.8,331.0 1004.8,328.3C1004.8,325.6 1007.5,320.6 1009.2,317.6C1010.9,314.7 1012.7,311.4 1015.1,310.6C1017.5,309.8 1021.1,311.6 1023.6,312.8C1026.2,314.1 1028.9,316.1 1030.2,318.3C1031.6,320.5 1032.3,323.2 1032.0,326.1Z",
        opacity: 0.26,
    },
    {
        d: "M1043.2,220.4C1042.5,223.2 1039.0,225.1 1036.7,228.2C1034.3,231.3 1032.3,238.0 1029.2,238.8C1026.1,239.7 1021.0,236.2 1018.1,233.2C1015.2,230.3 1012.4,224.1 1011.9,221.1C1011.4,218.2 1012.8,217.3 1015.1,215.5C1017.3,213.7 1022.7,210.7 1025.4,210.2C1028.0,209.8 1028.2,212.6 1030.9,212.9C1033.5,213.2 1039.2,210.7 1041.2,211.9C1043.3,213.2 1044.0,217.7 1043.2,220.4Z",
        opacity: 0.28,
    },
    {
        d: "M1096.4,245.6C1096.1,247.8 1094.4,251.2 1092.9,253.2C1091.5,255.1 1090.1,257.1 1087.6,257.3C1085.0,257.5 1079.9,255.9 1077.6,254.3C1075.2,252.8 1073.9,250.8 1073.2,248.0C1072.5,245.2 1072.0,239.9 1073.4,237.3C1074.8,234.6 1079.1,232.2 1081.6,232.0C1084.0,231.8 1085.8,234.7 1088.0,236.0C1090.2,237.2 1093.5,238.1 1094.9,239.7C1096.3,241.3 1096.7,243.3 1096.4,245.6Z",
        opacity: 0.24,
    },
    {
        d: "M987.3,264.6C986.6,266.4 980.5,267.3 978.1,268.7C975.6,270.2 975.2,272.0 972.4,273.3C969.6,274.5 963.8,277.3 961.3,276.1C958.8,275.0 957.5,269.2 957.4,266.4C957.4,263.5 959.0,261.8 961.2,259.2C963.3,256.6 967.7,251.9 970.2,250.7C972.8,249.5 974.6,250.8 976.6,252.0C978.6,253.2 980.4,256.0 982.2,258.1C984.0,260.2 988.0,262.9 987.3,264.6Z",
        opacity: 0.26,
    },
    {
        d: "M1081.4,296.3C1080.5,299.8 1077.7,304.3 1074.7,305.9C1071.7,307.6 1066.3,306.9 1063.3,306.1C1060.3,305.4 1058.2,302.9 1056.6,301.2C1054.9,299.6 1054.9,298.3 1053.5,296.1C1052.1,293.9 1047.2,290.1 1048.2,288.0C1049.1,286.0 1055.8,284.1 1059.1,283.7C1062.5,283.4 1064.8,285.6 1068.3,285.8C1071.8,286.0 1077.9,283.2 1080.1,285.0C1082.3,286.7 1082.3,292.9 1081.4,296.3Z",
        opacity: 0.22,
    },
]

const freckles: Array<{ cx: number; cy: number; r: number }> = [
    { cx: 1088.2, cy: 297.2, r: 3.1 },
    { cx: 1019.3, cy: 263.9, r: 2.6 },
    { cx: 1062.5, cy: 260, r: 4.5 },
    { cx: 1049.7, cy: 314.3, r: 4.1 },
    { cx: 1021.9, cy: 320.3, r: 3 },
    { cx: 1011.4, cy: 247.1, r: 2.8 },
    { cx: 1078.1, cy: 314, r: 3.7 },
    { cx: 1042.2, cy: 248.2, r: 3.9 },
    { cx: 1081.3, cy: 270.1, r: 3.3 },
    { cx: 1054, cy: 207.3, r: 4.6 },
    { cx: 995, cy: 262, r: 3.8 },
    { cx: 965, cy: 282.7, r: 3.1 },
]

// Grass on the crest: blade tufts (stroked) and two leafy sprigs.
const grassBladesPath =
    "M144,772.6 Q141.6,763.4 136,758.6 M148,772.6 Q148.3,760.4 149,753.6 M152,772.6 Q154.7,762.8 161,757.6 M208,761.4 Q205.6,752.2 200,747.4 M212,761.4 Q212.3,749.2 213,742.4 M216,761.4 Q218.7,751.6 225,746.4 M424,760.9 Q421.6,751.7 416,746.9 M428,760.9 Q428.3,748.7 429,741.9 M432,760.9 Q434.7,751.1 441,745.9 M486,770.5 Q483.6,761.3 478,756.5 M490,770.5 Q490.3,758.3 491,751.5 M494,770.5 Q496.7,760.7 503,755.5 M581,791.9 Q578.6,782.7 573,777.9 M585,791.9 Q585.3,779.7 586,772.9 M589,791.9 Q591.7,782.1 598,776.9 M664,814.6 Q661.6,805.4 656,800.6 M668,814.6 Q668.3,802.4 669,795.6 M672,814.6 Q674.7,804.8 681,799.6"

const sprigStemsPath = "M244,758.6 Q246,748.6 250,740.6 M462,766.6 Q464,756.6 468,748.6"

const sprigLeaves: Array<{ cx: number; cy: number; rx: number; ry: number; rot: number }> = [
    { cx: 245, cy: 748.6, rx: 4, ry: 2, rot: -40 },
    { cx: 250, cy: 744.6, rx: 4, ry: 2, rot: 30 },
    { cx: 251, cy: 739.6, rx: 3.5, ry: 1.8, rot: -25 },
    { cx: 463, cy: 756.6, rx: 4, ry: 2, rot: -40 },
    { cx: 468, cy: 752.6, rx: 4, ry: 2, rot: 30 },
    { cx: 469, cy: 747.6, rx: 3.5, ry: 1.8, rot: -25 },
]

// ---- Portrait re-staging (same art, phone-shaped viewport) ----
//
// The baked geometry above was authored for a 1440x900 landscape stage and
// `slice` crops it symmetrically, so a phone-shaped viewport used to crop
// BOTH subjects out (the boy lives at x≈285-420, the moon at x≈935-1125 — a
// 390px-wide window centered at 720 shows neither). Below the square
// threshold the scene re-stages the same art on a 720x1080 portrait canvas:
// moon high center-right, boy on the crest lower-left, both inside the
// guaranteed-visible center band of any phone aspect down to ~0.4.

interface SceneGeometry {
    viewBox: string
    moon: { cx: number; cy: number; r: number; haloR: number; blur: number }
    /** Repositions the moon's baked maria/freckle art (authored around the
     * landscape moon center) under the portrait moon. */
    moonArtTransform: string | undefined
    boyTransform: string
    stringPath: string
    /** Re-stages the hill/grass/sprig geometry (authored on the 1440-wide
     * stage) onto the portrait canvas. */
    groundTransform: string | undefined
}

const landscapeScene: SceneGeometry = {
    viewBox: "0 0 1440 900",
    moon,
    moonArtTransform: undefined,
    boyTransform,
    stringPath,
    groundTransform: undefined,
}

const portraitMoon = { cx: 400, cy: 430, r: 95, haloR: 228, blur: 4.3 }

const portraitScene: SceneGeometry = {
    viewBox: "0 0 720 1080",
    moon: portraitMoon,
    // The maria/freckle paths are authored around the landscape moon center
    // (1030, 275); shift them under the portrait moon.
    moonArtTransform: `translate(${portraitMoon.cx - moon.cx}, ${portraitMoon.cy - moon.cy})`,
    // Feet on the re-staged crest (hill y≈942 at this x), same 0.68 scale.
    boyTransform: "translate(170, 798.5) scale(0.68)",
    // Hand at (244.8, 804.6) up to the moon's lower-left edge, same gentle sag.
    stringPath: "M244.8,804.6 Q280,620 335,505",
    // Halve the hill's width and drop it so the crest rides the bottom band.
    groundTransform: "translate(0, 180) scale(0.5, 1)",
}

/**
 * True when the scene should re-stage for a phone-shaped viewport. At the
 * square threshold the landscape band already crops the boy's shoulder, so
 * anything narrower than 1:1 takes the portrait canvas.
 */
function isPortraitSceneAspect(width: number, height: number): boolean {
    return height > 0 && width / height < 1
}

function NightScene({ scene }: { scene: SceneGeometry }): React.ReactElement {
    return (
        <svg
            className={styles.scene}
            viewBox={scene.viewBox}
            preserveAspectRatio="xMidYMax slice"
            role="img"
            aria-label="A boy on a grassy hill holding the moon on a string"
        >
            <defs>
                <radialGradient id="spaceboy-moon" cx="42%" cy="38%" r="72%">
                    <stop offset="0%" stopColor="#fff3ca" />
                    <stop offset="55%" stopColor="#fbe4a6" />
                    <stop offset="86%" stopColor="#f7d78e" />
                    <stop offset="100%" stopColor="#ffedb9" />
                </radialGradient>
                <radialGradient id="spaceboy-moon-halo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffe296" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#ffe296" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#ffe296" stopOpacity="0" />
                </radialGradient>
                <filter id="spaceboy-moon-soften" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation={scene.moon.blur} />
                </filter>
                <clipPath id="spaceboy-moon-clip">
                    <circle cx={scene.moon.cx} cy={scene.moon.cy} r={scene.moon.r} />
                </clipPath>
            </defs>

            {/* The moon, floating like a balloon in the upper right. */}
            <circle
                className={styles.moonHalo}
                cx={scene.moon.cx}
                cy={scene.moon.cy}
                r={scene.moon.haloR}
                fill="url(#spaceboy-moon-halo)"
            />
            <circle cx={scene.moon.cx} cy={scene.moon.cy} r={scene.moon.r} fill="url(#spaceboy-moon)" />
            <g clipPath="url(#spaceboy-moon-clip)" filter="url(#spaceboy-moon-soften)">
                <g transform={scene.moonArtTransform}>
                    {mariaPatches.map((patch, index) => (
                        <path key={index} d={patch.d} fill="#dfb570" opacity={patch.opacity} />
                    ))}
                    {freckles.map((f, index) => (
                        <circle key={index} cx={f.cx} cy={f.cy} r={f.r} fill="#d8ab5e" opacity={0.28} />
                    ))}
                </g>
            </g>

            {/* The string, drawn under the hill and boy so it ends at his hand. */}
            <path
                d={scene.stringPath}
                fill="none"
                stroke="#f0c060"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray="1 11"
                opacity={0.8}
            />

            {/* The hill, the grass, and the boy holding the string. */}
            <g transform={scene.groundTransform}>
                <path d={hillPath} fill={ink} />
                <path
                    d={grassBladesPath}
                    fill="none"
                    stroke={ink}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    // The portrait ground transform is non-uniform (x halved);
                    // without this the blade strokes render as flattened ellipses.
                    vectorEffect={scene.groundTransform === undefined ? undefined : "non-scaling-stroke"}
                />
                <path
                    d={sprigStemsPath}
                    fill="none"
                    stroke={ink}
                    strokeWidth={2}
                    strokeLinecap="round"
                    vectorEffect={scene.groundTransform === undefined ? undefined : "non-scaling-stroke"}
                />
                {sprigLeaves.map((leaf, index) => (
                    <ellipse
                        key={index}
                        cx={leaf.cx}
                        cy={leaf.cy}
                        rx={leaf.rx}
                        ry={leaf.ry}
                        transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`}
                        fill={ink}
                    />
                ))}
            </g>
            <g transform={scene.boyTransform}>
                <path d={boyPath} fill={ink} />
            </g>
        </svg>
    )
}

export default function BlankPage(): React.ReactElement {
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const [isPortrait, setIsPortrait] = React.useState(false)
    React.useEffect(() => {
        const node = rootRef.current
        // No ResizeObserver (old engines, some test doms): keep the landscape
        // composition — today's behavior, correct on every desktop viewport.
        if (node === null || typeof ResizeObserver === "undefined") {
            return undefined
        }
        const observer = new ResizeObserver(() => {
            const rect = node.getBoundingClientRect()
            setIsPortrait(isPortraitSceneAspect(rect.width, rect.height))
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])
    return (
        <div ref={rootRef} className={styles.page}>
            {stars.map((s, index) => (
                <span
                    key={index}
                    className={styles.star}
                    style={{
                        left: s.left,
                        top: s.top,
                        width: s.size,
                        height: s.size,
                        animationDuration: s.duration,
                        animationDelay: s.delay,
                    }}
                    aria-hidden
                />
            ))}
            <NightScene scene={isPortrait ? portraitScene : landscapeScene} />
        </div>
    )
}
