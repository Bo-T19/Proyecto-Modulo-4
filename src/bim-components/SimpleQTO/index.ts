import * as WEBIFC from "web-ifc"
import * as OBC from "@thatopen/components"
import * as FRAGS from "@thatopen/fragments"

type QtoResult = { [setName: string]: { [qtoName: string]: number } }

interface QtoTableItem {
    data: {
        Name: string;
    };
    children?: Array<{
        data: {
            Name: string;
            Quantity: number;
        }
    }>;
}

export class SimpleQTO extends OBC.Component implements OBC.Disposable {
    static uuid = "3b5e8cea-9983-4bf6-b120-51152985b22d"
    enabled = true
    onDisposed: OBC.Event<any>
    qtoResult: QtoResult = {}
    qtosTableData: QtoTableItem[] = [];

    constructor(components: OBC.Components) {
        super(components)
        this.components.add(SimpleQTO.uuid, this)
        this.qtosTableData = [];
    }

    async sumQuantities(fragmentIdMap: FRAGS.FragmentIdMap) {
        console.time("QTO V2")
        const fragmentManager = this.components.get(OBC.FragmentsManager)
        const modelIdMap = fragmentManager.getModelIdMap(fragmentIdMap)
        const processedModels = new Set<string>();

        for (const modelId in modelIdMap) {
            if (processedModels.has(modelId)) continue;
            processedModels.add(modelId);

            const model = fragmentManager.groups.get(modelId)
            if (!model) continue
            if (!model.hasProperties) continue;

            for (const fragmentID in fragmentIdMap) {
                const expressIDs = fragmentIdMap[fragmentID]
                const indexer = this.components.get(OBC.IfcRelationsIndexer)

                for (const id of expressIDs) {
                    const sets = indexer.getEntityRelations(model, id, "IsDefinedBy")
                    if (!sets) continue

                    for (const expressID of sets) {
                        const set = await model.getProperties(expressID)
                        const { name: setName } = await OBC.IfcPropertiesUtils.getEntityName(model, expressID)

                        if (set?.type !== WEBIFC.IFCELEMENTQUANTITY || !setName) continue

                        if (!(setName in this.qtoResult)) {
                            this.qtoResult[setName] = {}
                            // Add a new item to the table list
                            this.qtosTableData.push({
                                data: { Name: setName },
                                children: []
                            });
                        }

                        await OBC.IfcPropertiesUtils.getQsetQuantities(
                            model,
                            expressID,
                            async (qtoID) => {
                                const { name: qtoName } = await OBC.IfcPropertiesUtils.getEntityName(model, qtoID)
                                const { value } = await OBC.IfcPropertiesUtils.getQuantityValue(model, qtoID)

                                if (!qtoName || !value) return

                                if (!(qtoName in this.qtoResult[setName])) {
                                    this.qtoResult[setName][qtoName] = 0
                                }
                                this.qtoResult[setName][qtoName] += value

                                // Add the qto to the corresponding set
                                const setIndex = this.qtosTableData.findIndex(item => item.data.Name === setName);
                                if (setIndex !== -1) {
                                    this.qtosTableData[setIndex].children?.push({
                                        data: {
                                            Name: qtoName,
                                            Quantity: value
                                        }
                                    });
                                }
                            }
                        )
                    }
                }
            }
        }

        console.log("Resultados QTO:", this.qtoResult)
        console.log("Tabla QTO:", this.qtosTableData)
        console.timeEnd("QTO V2")
    }

    //Export a quantities to JSON
    exportToJSON(fileName: string = "quantities") {
        const json = JSON.stringify(this.qtoResult, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
    }

    async dispose() { }
}