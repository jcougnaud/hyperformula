import {Graph} from "./Graph";
import {CellVertex, Vertex} from "./Vertex";
import {AddressMapping} from "./AddressMapping";
import {SimpleArrayAddressMapping} from "./SimpleArrayAddressMapping";
import {Pool} from "./worker/Pool";

const NUMBER_OF_WORKERS = 3

export class Distributor {
  private pool: Pool

  constructor(
      private graph: Graph<Vertex>,
      private addressMapping: SimpleArrayAddressMapping,
  ) {
    this.pool = new Pool(NUMBER_OF_WORKERS)
    this.pool.init()
  }


  public distribute(): Map<Color, WorkerInitPayload> {
    let { sorted, cycled } = this.topSort()

    const coloredChunks: Map<Color, WorkerInitPayload> = new Map()

    sorted.forEach(colorNode => {
      if (!coloredChunks.has(colorNode.color)) {
        coloredChunks.set(colorNode.color, {
          type: "INIT",
          nodes: [],
          edges: new Map(),
          addressMapping: this.addressMapping.mapping,
          sheetWidth: this.addressMapping.getWidth(),
          sheetHeight: this.addressMapping.getHeight(),
        })
      }

      const subgraph = coloredChunks.get(colorNode.color)!
      subgraph.nodes.push(colorNode.node)
      subgraph.edges.set(colorNode.node, this.graph.adjacentNodes(colorNode.node))
    })

    this.pool.addWorkerTaskForAllWorkers((workerId: number) => {
      return {
        data: coloredChunks.get(workerId),
        callback: this.onWorkerMessage
      }
    })

    return coloredChunks
  }

  private onWorkerMessage(message: any) {
    switch (message.data.type) {
      case "INITIALIZED": console.log("worker initialized")
    }
  }

  public topSort(): { sorted: ColorNode[], cycled: Vertex[] } {
    const incomingEdges = this.incomingEdges()
    const dominantColors = this.initDominantColors()

    const danglingNodes = this.colorNodes(this.danglingNodes(incomingEdges))

    let currentNodeIndex = 0
    const sorted: ColorNode[] = []

    while (currentNodeIndex < danglingNodes.length) {
      const node = danglingNodes[currentNodeIndex]

      sorted.push(node)

      this.graph.getEdges().get(node.node)!.forEach((targetNode) => {
        ++dominantColors.get(targetNode)![node.color]
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! - 1)

        if (incomingEdges.get(targetNode) === 0) {
          danglingNodes.push({
            color: this.getDominantColor(dominantColors.get(targetNode)!),
            node: targetNode
          })
        }
      })

      ++ currentNodeIndex
    }

    if (sorted.length !== this.graph.nodes.size) {
      const nodesOnCycle = new Set(this.graph.nodes.values())
      for (let i = 0; i < sorted.length; ++i) {
        nodesOnCycle.delete(sorted[i].node)
      }
      return {
        sorted: sorted,
        cycled: Array.from(nodesOnCycle)
      }
    }

    return {
      sorted: sorted,
      cycled: []
    }
  }

  private getDominantColor(colors: Color[]): Color {
    let max = colors[0]
    let maxIndex = 0

    for (let i=1; i<colors.length; ++i) {
      if (colors[i] > max) {
        maxIndex = i
        max = colors[i]
      }
    }

    return maxIndex
  }

  private danglingNodes(incomingEdges: Map<Vertex, number>): Vertex[] {
    const result: Vertex[] = []
    incomingEdges.forEach((currentCount, targetNode) => {
      if (currentCount === 0) {
        result.push(targetNode)
      }
    })
    return result
  }

  private colorNodes(nodes: Vertex[]): ColorNode[] {
    let currentColor = 0
    const result: ColorNode[] = []
    nodes.forEach(node => {
      result.push({
        color: (++currentColor) % NUMBER_OF_WORKERS,
        node: node
      })
    })
    return result
  }

  private initDominantColors(): Map<Vertex, Color[]> {
    const result = new Map()
    this.graph.getNodes().forEach((node) => {
      result.set(node, new Int32Array(NUMBER_OF_WORKERS))
    })
    return result
  }

  private incomingEdges(): Map<Vertex, number> {
    const incomingEdges: Map<Vertex, number> = new Map()
    this.graph.getNodes().forEach((node) => (incomingEdges.set(node, 0)))
    this.graph.getEdges().forEach((adjacentNodes, sourceNode) => {
      adjacentNodes.forEach((targetNode) => {
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! + 1)
      })
    })
    return incomingEdges
  }
}

export type Color = number

export type WorkerInitPayload = {
  type: "INIT",
  nodes: Vertex[],
  edges: Map<Vertex, Set<Vertex>>,
  addressMapping: Int32Array,
  sheetWidth: number,
  sheetHeight: number,
}

interface ColorNode {
  color: Color,
  node: Vertex
}