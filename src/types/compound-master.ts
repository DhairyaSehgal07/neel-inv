export interface CompoundMaster {
    _id: string;
    compoundCode: string;
    compoundName: string;
    category: string;
    rawMaterials: string[];
    defaultWeightPerBatch: number;
    createdAt: Date;
    updatedAt: Date;
}