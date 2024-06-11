# Array-work
# Left Rotation Java Program

This Java program performs left rotations on an array. A left rotation operation on an array shifts each of the array's elements 1 unit to the left. For example, if 2 left rotations are performed on array [1, 2, 3, 4, 5], then the array would become [3, 4, 5, 1, 2].

## How It Works

The program consists of a main class LeftRotation that includes the rotLeft method to perform the left rotations and a main method to handle user input and output the results.

### rotLeft Method

```java
public static int[] rotLeft(int[] a, int d) {
    int n = a.length;
    int[] rotatedArray = new int[n];

    for (int i = 0; i < n; i++) {
        rotatedArray[(i + n - d) % n] = a[i];
    }

    return rotatedArray;
}
