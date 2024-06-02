Hi all,

Since I've managed to resolve most of the animations issues I was having, I decided to relax and work on some level design, keeping in mind that the overall goal was to make  enough content to bring the player from level 1 to level 10. The overall feeling should feel "grindy".

## Preparation is KEY

Before starting any level design, I want to create a list of all the different locations, enemies and characters.

I had a pretty good idea already, but Took me a little while to write it all down and then using CHATGPT to tidy up the structure, I got to this result: 

> Eldoria is a quaint village nestled between lush forests and towering mountains. 

### Locations

*   **Forge**: The heart of Eldoria’s craftsmanship, where the Blacksmith, Garin, forged weapons and armor to aid adventurers.
*   **Temple**: A sanctuary dedicated to Athlea, watched over by Priestess Alice, who also guarded the entrance to the rat-infested Cellar dungeon.
*   **Farm**: A sprawling field tended by Farmer Jorin, who provided food for the village.
*   **Tavern**: The lively hub of Eldoria, run by Bartender Morin, where stories and quests were exchanged.
*   **Market**: Bustling with activity, the Merchant Elara sold potions and jewelry to aid adventurers in their quests.
*   **Mountains**: Majestic and foreboding, they housed the entrance to the treacherous Cave dungeon.
*   **Cemetery**: A somber place tended by Caretaker Ren, and the entrance to the Mausoleum dungeon.
*   **Forest**: Dense and dark, home to fearsome Bandits and the site of many trials.
*   **Sorceress Tower**: The mystical home of Sorceress Mira, where adventurers could learn offensive magic.
*   **Velvet Veil**: A luxurious establishment in Eldoria, known for its warm hospitality, soothing ambiance, and vibrant performances. 
*   **Port**: Locations of future development and potential quests.

### Dungeons

*   **Cellar**: Beneath the Temple, infested with vicious Rats, perfect for novice adventurers.
*   **Mausoleum**: In the Cemetery, filled with powerful Skeletons, posing a greater challenge.
*   **Cave**: In the Mountains, housing cunning Mummies, a trial for the most seasoned heroes.

### People

*   **Blacksmith Garin**: A master of the forge, providing essential equipment.
*   **Merchant Elara**: A savvy trader in potions and enchanted items.
*   **Sorceress Mira**: A wise mage who trained adventurers in offensive magic and resided in the Sorceress Tower.
*   **Priestess Alice**: A devout priestess who taught defensive spells and sought help for the Temple’s troubles.
*   **Farmer Jorin**: A simple farmer with untold stories.
*   **Bartender Morin**: The keeper of the tavern and a source of many quests.
*   **Caretaker Ren**: Guardian of the cemetery, harboring secrets of the Mausoleum.
*   **Madame Seraphina**: Proprietor of the Velvet Veil.

### Enemies

*   **Rats**: Infesting the Cellar, a challenge for heroes levels 1-3.
*   **Skeletons**: Haunting the Mausoleum, suited for heroes levels 3-6.
*   **Bandits**: Roaming the Forest, a danger for heroes levels 6-8.
*   **Mummies**: Dwelling in the Cave, a peril for heroes levels 8-10.

---


## Level Design Workflow

Once I've clarified the overall content, it's time to start level design, please see below the steps I followed to get my scene from Unity to Babylon.js

- I use the Unity editor for the level design 
- I export the whole scene as a GLB format, and then I use https://gltf.report/ to optimize the scene, size can go from 2-3mo to 100ko.
- I also use the unity **navigation system** to generate a **navmesh**, export it to an .OBJ file, import it in Blender, do some mesh optimization/fixes and then export to a .GLB file than can be used by the server and client.
  
> In order for my LOD system to function, meshes must never too big in the horizontal axis, else player will have meshes that disappear when they shouldnt so I always make sure to not make any objects that span large chunks of the level.

 
## The result

After quite a bit of work, I actually managed to fit everything in quite a small area (which suits me just fine). The idea is too keep everything tight and condensed. Of course, this map will elvove/improve naturally as I work on it. A few thing to bother me:
- The actual farm should be moved closer to the mountain (and not in the village center)
- Market should probably be in the town center
- The Velvet Veil in front of the Temple may be a little ...
- 

MAP IMAGE HERE

---

So, What do you guys think of the result?


Until next time, 
Orion




