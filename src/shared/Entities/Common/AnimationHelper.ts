export default class AnimationHelper {
    static RetargetSkeletonToAnimationGroup(animationGroup, retargetSkeleton) {
        for (let i = 0; i < animationGroup.targetedAnimations.length; ++i) {
            const ta = animationGroup.targetedAnimations[i];
            const bone = AnimationHelper._FindBoneByTransformNodeName(retargetSkeleton, ta.target.name);
            if (!bone) {
                animationGroup.targetedAnimations.splice(i, 1);
                i--;
                continue;
            }
            bone._linkedTransformNode = ta.target;
        }
    }

    static RetargetAnimationGroupToRoot(animationGroup, root) {
        for (let i = 0; i < animationGroup.targetedAnimations.length; ++i) {
            const ta = animationGroup.targetedAnimations[i];
            const children = root.getDescendants(false, (node) => node.name === ta.target.name);
            if (children.length === 0) {
                animationGroup.targetedAnimations.splice(i, 1);
                i--;
                continue;
            }
            ta.target = children[0];
        }
    }
    static _FindBoneByTransformNodeName(skeleton, name) {
        for (const bone of skeleton.bones) {
            if (bone._linkedTransformNode.name === name) {
                return bone;
            }
        }
        return null;
    }
}
