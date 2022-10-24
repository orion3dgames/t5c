import nengi from 'nengi'

class Identity {
    constructor(id) {
        this.entityId = id
    }
}

Identity.protocol = {
    entityId: nengi.UInt16
}

export default Identity