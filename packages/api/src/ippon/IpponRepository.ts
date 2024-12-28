import { COLLECTION_NAME } from '../const'
import {
  Ippon,
  IpponCreateRequest,
  IpponGetAllRequest,
  IpponGetAllResponse,
  IpponGetByUserRequest,
} from './Ippon'
import { createDoc, db } from '../firebase/firestore'

export interface IpponRepository {
  /** IPPON のデータ作成 */
  create(params: IpponCreateRequest): Promise<Ippon>

  /** ユーザーの現在の IPPON 数を取得 */
  getIpponCountByUser(params: IpponGetByUserRequest): Promise<number>

  /** 指定したお題の IPPON をすべて取得 */
  getAllIpponOfOdai(params: IpponGetAllRequest): Promise<IpponGetAllResponse>
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

  async getAllIpponOfOdai(params: IpponGetAllRequest): Promise<IpponGetAllResponse> {
    const snapshot = await ipponOdaiCollection({
      slackTeamId: params.slackTeamId,
      odaiDocId: params.odaiId,
    }).get()

    const ipponList: Ippon[] = []
    snapshot.forEach((doc) => {
      const data = doc.data() as Ippon
      ipponList.push(data)
    })

    return ipponList
  }
}
