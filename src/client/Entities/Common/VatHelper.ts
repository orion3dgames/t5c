import { Mesh } from "@babylonjs/core/Meshes/mesh";

function calculateRanges(animationGroups) {
    return animationGroups.reduce((acc, ag, index) => {
        if (index === 0) {
            acc.push({ from: Math.floor(ag.from), to: Math.floor(ag.to) });
        } else {
            const prev = acc[index - 1];
            acc.push({ from: prev.to + 1, to: prev.to + 1 + Math.floor(ag.to) });
        }
        return acc;
    }, []);
}

const setAnimationParameters = function (vec, animIndex, ranges) {
    animIndex = animIndex ?? 0;
    const anim = ranges[animIndex];
    const from = Math.floor(anim.from);
    const to = Math.floor(anim.to);
    const ofst = 0;
    vec.set(from, to - 1, ofst, 60); // skip one frame to avoid weird artifacts
    return animIndex;
};

/**
 *
 */
const bakeVertexData = async function (mesh: Mesh, ags) {
    const s = mesh.skeleton;
    const boneCount = s.bones.length;
    /** total number of frames in our animations */
    const frameCount = ags.reduce((acc, ag) => acc + (Math.floor(ag.to) - Math.floor(ag.from)) + 1, 0);

    // reset our loop data
    let textureIndex = 0;
    const textureSize = (boneCount + 1) * 4 * 4 * frameCount;
    const vertexData = new Float32Array(textureSize);

    function* captureFrame() {
        const skeletonMatrices = s.getTransformMatrices(mesh);
        vertexData.set(skeletonMatrices, textureIndex * skeletonMatrices.length);
    }

    let ii = 0;
    for (const ag of ags) {
        ag.reset();
        const from = Math.floor(ag.from);
        const to = Math.floor(ag.to);
        for (let frameIndex = from; frameIndex <= to; frameIndex++) {
            if (ii++ === 0) continue;
            // start anim for one frame
            ag.start(false, 1, frameIndex, frameIndex, false);
            // wait for finishing
            await ag.onAnimationEndObservable.runCoroutineAsync(captureFrame());
            textureIndex++;
            // stop anim
            ag.stop();
        }
    }

    return vertexData;
};

export { bakeVertexData, calculateRanges, setAnimationParameters };
