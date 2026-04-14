export class RoomsService {
    est(establishmentId: string) {
        return `est:${establishmentId}`;
    }

    servicePoint(establishmentId: string, spId: string) {
        return `est:${establishmentId}:sp:${spId}`;
    }
}
