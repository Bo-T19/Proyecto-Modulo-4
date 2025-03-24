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

    const qtoTable = BUI.Component.create<BUI.Table>(() => {
        return BUI.html`
        <bim-table></bim-table>
        `
    })

    //qtoTable.data = [{data:qtoComponent.qtoResult}]

}