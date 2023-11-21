// Firestore
import { Timestamp, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

// Third Party Imports
import { z } from "zod"
import {
    ResultsBy,
    Statement,
    StatementSchema,
    StatementSubscription,
    StatementType,
    UserSchema,
} from "delib-npm"
import { Collections, Role } from "delib-npm"
import { getUserPermissionToNotifications } from "../../notifications"
import { getUserFromFirebase } from "../users/usersGeneral"
import { DB, deviceToken } from "../config"

const TextSchema = z.string().min(2)

export async function setStatmentToDB(
    statement: Statement,
    addSubscription: boolean = true
) {
    try {
       
        TextSchema.parse(statement.statement)
        statement.consensus = 0

        statement.lastUpdate = Timestamp.now().toMillis();
        statement.statementType = statement.statementType || StatementType.statement
        const {results, resultsSettings} = statement
        if(!results) statement.results = {consensus:[], votes: []}
        if(!resultsSettings) statement.resultsSettings = {resultsBy:ResultsBy.topVote}
        

        StatementSchema.parse(statement)
        UserSchema.parse(statement.creator)

        //set statement
        const statementRef = doc(
            DB,
            Collections.statements,
            statement.statementId
        )
        const statementPromises = []

        const statementPromise = await setDoc(statementRef, statement, {
            merge: true,
        })

        statementPromises.push(statementPromise)

        //add subscription

        if (addSubscription) {
            statementPromises.push(
                setStatmentSubscriptionToDB(
                    statement,
                    Role.statementCreator,
                    true
                )
            )
            statementPromises.push(getUserPermissionToNotifications())

            const [_, __, canGetNotifications] = await Promise.all(
                statementPromises
            )

            if (canGetNotifications)
                await setStatmentSubscriptionNotificationToDB(statement)
        } else {
            await Promise.all(statementPromises)
        }

        return statement.statementId
    } catch (error) {
        console.error(error)
        return undefined
    }
}

export async function setStatmentSubscriptionToDB(
    statement: Statement,
    role: Role,
    setNotifications: boolean = false
) {
    try {
        const user = getUserFromFirebase()
        if (!user) throw new Error("User not logged in")
        if (!user.uid) throw new Error("User not logged in")
        const { statementId } = statement
        StatementSchema.parse(statement)

        const statementsSubscribeId = `${user.uid}--${statementId}`

        if (role === Role.admin) setNotifications = true

        const statementsSubscribeRef = doc(
            DB,
            Collections.statementsSubscribe,
            statementsSubscribeId
        )

        await setDoc(
            statementsSubscribeRef,
            {
                user,
                notification: setNotifications,
                statement,
                statementsSubscribeId,
                role,
                userId: user.uid,
                statementId,
                lastUpdate: Timestamp.now().toMillis(),
                createdAt: Timestamp.now().toMillis(),
            },
            { merge: true }
        )
    } catch (error) {
        console.error(error)
    }
}

export async function updateStatementText(
    statement: Statement | undefined,
    newText: string
) {
    try {
        if (!newText) throw new Error("New text is undefined")
        if (!statement) throw new Error("Statement is undefined")
        if (statement.statement === newText) return

        StatementSchema.parse(statement)
        const statementRef = doc(
            DB,
            Collections.statements,
            statement.statementId
        )
        const newStatement = {
            statement: newText,
            lastUpdate: Timestamp.now().toMillis(),
        }
        await updateDoc(statementRef, newStatement)
    } catch (error) {}
}

export async function setStatmentSubscriptionNotificationToDB(
    statement: Statement | undefined
) {
    try {
        const token = deviceToken

        if (!token) throw new Error("Token is undefined")

        if (!statement) throw new Error("Statement is undefined")
        const { statementId } = statement

        //ask user for permission to send notifications

        await getUserPermissionToNotifications()

        const user = getUserFromFirebase()
        if (!user) throw new Error("User not logged in")
        if (!user.uid) throw new Error("User not logged in")

        const statementsSubscribeId = `${user.uid}--${statementId}`
        const statementsSubscribeRef = doc(
            DB,
            Collections.statementsSubscribe,
            statementsSubscribeId
        )
        const statementSubscriptionDB = await getDoc(statementsSubscribeRef)

        if (!statementSubscriptionDB.exists()) {
            //set new subscription

            await setDoc(
                statementsSubscribeRef,
                {
                    user,
                    userId: user.uid,
                    statementId,
                    token,
                    notification: true,
                    lastUpdate: Timestamp.now().toMillis(),
                    statementsSubscribeId,
                    statement,
                },
                { merge: true }
            )
        } else {
            //update subscription
            const statementSubscription =
                statementSubscriptionDB.data() as StatementSubscription

            let { notification } = statementSubscription
            notification = !notification

            await setDoc(
                statementsSubscribeRef,
                { token, notification },
                { merge: true }
            )
        }
    } catch (error) {
        console.error(error)
    }
}

export async function setStatementisOption(statement: Statement) {
    try {
        const statementRef = doc(
            DB,
            Collections.statements,
            statement.statementId
        )

        //get current statement
        const statementDB = await getDoc(statementRef)
        if (!statementDB.exists()) throw new Error("Statement not found")

        const statementDBData = statementDB.data() as Statement
        const { statementType} = statementDBData
        if (statementType === StatementType.option) {
            await setDoc(statementRef, { isOption: false }, { merge: true })
        } else {
            await setDoc(statementRef, { isOption: true }, { merge: true })
        }
    } catch (error) {
        console.error(error)
    }
}

export async function setStatmentGroupToDB(statement: Statement) {
    try {
        if (statement.type === StatementType.statement) return

        const statementId = statement.statementId
        const statementRef = doc(DB, Collections.statements, statementId)
        await setDoc(
            statementRef,
            { statementType: StatementType.statement },
            { merge: true }
        )
    } catch (error) {
        console.error(error)
    }
}

export async function updateSubscriberForStatementSubStatements(
    statement: Statement
) {
    try {
        const user = getUserFromFirebase()
        if (!user) throw new Error("User not logged in")
        if (!user.uid) throw new Error("User not logged in")

        const statementsSubscribeId = `${user.uid}--${statement.statementId}`

        const statementsSubscribeRef = doc(
            DB,
            Collections.statementsSubscribe,
            statementsSubscribeId
        )
        const newSubStatmentsRead = {
            totalSubStatementsRead: statement.totalSubStatements || 0,
        }

        await updateDoc(statementsSubscribeRef, newSubStatmentsRead)
    } catch (error) {
        console.error(error)
    }
}

export function setRoomSizeInStatement(statement: Statement, roomSize: number) {
    try {
        z.number().parse(roomSize)
        StatementSchema.parse(statement)
        const statementRef = doc(
            DB,
            Collections.statements,
            statement.statementId
        )
        const newRoomSize = { roomSize }
        updateDoc(statementRef, newRoomSize)
    } catch (error) {
        console.error(error)
    }
}

export async function updateIsQuestion(statement: Statement) {
    try {
        const statementRef = doc(
            DB,
            Collections.statements,
            statement.statementId
        )
        let {statementType} = statement;
        if (statementType === StatementType.question) statementType = StatementType.statement
        else statementType = StatementType.question
       
        const newStatementType = { statementType }
        await updateDoc(statementRef, newStatementType)
    } catch (error) {
        console.error(error)
    }
}
