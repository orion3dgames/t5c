import { Mesh, Color3, VertexData, MeshBuilder, TransformNode, Vector3 } from "@babylonjs/core"
import { SimpleMaterial } from "@babylonjs/materials"

 function createConvexRegionHelper(navMesh, scene) {
    const regions = navMesh.regions
  
    const customMesh = new Mesh('custom', scene)
    customMesh.position = new Vector3(0,0.01,0);
    const customMeshMaterial = new SimpleMaterial('custom-mesh', scene)
    customMeshMaterial.diffuseColor = Color3.Random()
  
    customMesh.material = customMeshMaterial
  
    const positions = []
    const colors = []
  
    for (let region of regions) {
      // one color for each convex region
      const color = Color3.Random()
  
      // count edges
      let edge = region.edge
      const edges = []
  
      do {
        edges.push(edge)
        edge = edge.next
      } while (edge !== region.edge)
  
      // triangulate
  
      const triangleCount = edges.length - 2
  
      for (let i = 1, l = triangleCount; i <= l; i++) {
        const v1 = edges[0].vertex
        const v2 = edges[i + 0].vertex
        const v3 = edges[i + 1].vertex
  
        positions.push(v1.x, v1.y, v1.z)
        positions.push(v2.x, v2.y, v2.z)
        positions.push(v3.x, v3.y, v3.z)
  
        colors.push(color.r, color.g, color.b, 1)
        colors.push(color.r, color.g, color.b, 1)
        colors.push(color.r, color.g, color.b, 1)
      }
    }
  
    const indices = []
    for (let i = 0; i < positions.length / 3; i++) {
      indices.push(i)
    }
  
    const normals = []
  
    const vertexData = new VertexData()
    VertexData.ComputeNormals(positions, indices, normals)
  
    vertexData.positions = positions
    vertexData.indices = indices
    vertexData.normals = normals
    vertexData.colors = colors
  
    vertexData.applyToMesh(customMesh)
  
    var mat = new SimpleMaterial('mat', scene)
    mat.backFaceCulling = false
    customMesh.material = mat
  
    return customMesh
  }

  function createGraphHelper(scene, graph, nodeSize = 1, nodeColor = '#4e84c4', edgeColor = '#ffffff') {
    const nodes = []
    graph.getNodes(nodes)
  
    const parent = new TransformNode('nodes-parent', scene)
  
    for (let node of nodes) {
      const nodeMaterial = new SimpleMaterial('node', scene)
      nodeMaterial.diffuseColor = Color3.FromHexString(nodeColor)
  
      const nodeMesh = MeshBuilder.CreatePolyhedron(
        'node',
        {
          type: 3, // Icosahedron
          size: nodeSize,
        },
        scene
      )
      nodeMesh.parent = parent
      nodeMesh.material = nodeMaterial
      nodeMesh.position = new Vector3(node.position.x, node.position.y, node.position.z)
  
      // edges
      const edges = []
      const lines = []
      for (let node of nodes) {
        graph.getEdgesOfNode(node.index, edges)
  
        const position = []
        for (let edge of edges) {
          const fromNode = graph.getNode(edge.from)
          const toNode = graph.getNode(edge.to)
  
          position.push(new Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z))
          position.push(new Vector3(toNode.position.x, toNode.position.y, toNode.position.z))
        }
  
        lines.push(position)
      }
  
      const pathHelper = MeshBuilder.CreateLineSystem(
        'path-helper',
        {
          lines,
          updatable: false,
        },
        scene
      )
      pathHelper.color = Color3.Green()
      pathHelper.parent = parent
    }
  
    return parent
  }
  
  export { createConvexRegionHelper, createGraphHelper }