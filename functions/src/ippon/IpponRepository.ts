import { COLLECTION_NAME } from '../const'
import { createDoc, db } from '../firebase/firestore'
import { Ippon, IpponCreateRequest, IpponGetByUserRequest } from './Ippon'

export interface IpponRepository {
  create(params: IpponCreateRequest): Promise<Ippon>
  getIpponCountByUser(params: IpponGetByUserRequest): Promise<number>
}

const ipponOdaiCollection = ({
  slackTeamId,
  odaiDocId,
}: {
  slackTeamId: string
  odaiDocId: string
}) => {
  return db
    .collection(COLLECTION_NAME.ROOT)
    .doc(slackTeamId)
    .collection(COLLECTION_NAME.ODAI)
    .doc(odaiDocId)
    .collection(COLLECTION_NAME.IPPON)
}

export class IpponRepositoryImpl implements IpponRepository {
  async create(params: IpponCreateRequest): Promise<Ippon> {
    const newOdaiIpponRef = ipponOdaiCollection({
      slackTeamId: params.slackTeamId,
      odaiDocId: params.odaiId,
    }).doc()

    const data: Ippon = {
      ...params,
      createdAt: new Date(),
    }
    await createDoc<Ippon>(newOdaiIpponRef, data)
    return data
  }

  async getIpponCountByUser(params: IpponGetByUserRequest): Promise<number> {
    const snapshot = await ipponOdaiCollection({
      slackTeamId: params.slackTeamId,
      odaiDocId: params.odaiId,
    })
      .where('userId', '==', params.userId)
      .get()
    return snapshot.size
  }
}
