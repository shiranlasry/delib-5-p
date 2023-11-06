import { RoomAskToJoin, Statement } from 'delib-npm';
import { FC } from 'react';
import { useAppSelector } from '../../../../../../../functions/hooks/reduxHooks';
import { userSelectedTopicSelector } from '../../../../../../../model/statements/statementsSlice';
import _styles from './roomDivide.module.scss';
import Text from '../../../../../../components/text/Text';
const styles = _styles as any;



interface Props {
  statement: Statement;
}


const RoomQuestions: FC<Props> = ({ statement }) => {

  const userTopic:RoomAskToJoin|undefined = useAppSelector(userSelectedTopicSelector(statement.statementId));

  try {

    return (
      <>
        <h1>חלוקה לחדרים</h1>
        {/* {userTopic && userTopic.approved ? */}
        <div className={styles.message}>
          {userTopic && userTopic.statement ?
            <>
              <h2><Text text={`נושא הדיון: ${userTopic.statement.statement}`} onlyTitle={true} /></h2>
              <div className={styles.text}>מוזמן/ת לחדר מספר <span>{userTopic.roomNumber}</span> בזום</div>
            </>
            :
            <h2>לא נבחר נושא על ידך</h2>
          }
          </div>
        {/* :
          <div className={styles.container} style={{flexDirection:"column"}}>
            <h2>אנא המתינו לחלוקה לחדרים...</h2>
            <LoaderGlass />
          </div>
        } */}
      </>
    )
  } catch (error: any) {
    return (<div>error: {error.message}</div>)
  }
}

export default RoomQuestions