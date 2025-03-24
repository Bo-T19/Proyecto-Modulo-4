import * as OBC from "@thatopen/components"
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui"
import { SimpleQTO } from "..";

export interface SimpleQTOUIState {
    components: OBC.Components
}

export const qtoTool = (state: SimpleQTOUIState) => {
    const components = state.components
    const qtoComponent = components.get(SimpleQTO)

    //Create the qtoTable and its data
    const qtoTable = BUI.Component.create<BUI.Table>(() => {
        return BUI.html`
        <bim-table id="tasks-table" style="background-color: #f1f2f4; border-radius: 8px;">
        </bim-table>
        `
    })

    qtoTable.data = Object.entries(qtoComponent.qtoResult).map(([setName, quantities]) => ({
        data: {
            Name: setName,
            Description: `Quantities for ${setName}`,
        },
        children: Object.entries(quantities).map(([qtoName, value]) => ({
            data: {
                Name: qtoName,
                Quantity: value,
            }
        }))
    }));


    console.log(qtoTable.data)
    return qtoTable

}